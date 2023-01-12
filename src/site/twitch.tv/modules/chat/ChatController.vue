<template>
	<Teleport v-if="channel && channel.id" :to="containerEl">
		<UiScrollable ref="scroller" @container-scroll="chatAPI.onScroll" @container-wheel="chatAPI.onWheel">
			<div id="seventv-message-container" class="seventv-message-container">
				<ChatList :messages="messages" :controller="controller.component" />
			</div>
		</UiScrollable>

		<!-- Data Logic -->
		<ChatData />

		<!-- New Messages during Scrolling Pause -->
		<div
			v-if="scrollPaused && scrollBuffer.length > 0"
			class="seventv-message-buffer-notice"
			@click="chatAPI.unpauseScrolling"
		>
			<span>{{ scrollBuffer.length }}{{ scrollBuffer.length >= lineLimit ? "+" : "" }} new messages</span>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { onUnmounted, reactive, ref, toRefs, watch, watchEffect } from "vue";
import { until, useTimeout } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { debounceFn } from "@/common/Async";
import { log } from "@/common/Logger";
import { getRandomInt } from "@/common/Rand";
import { HookedInstance, awaitComponents } from "@/common/ReactHooks";
import { defineFunctionHook, definePropertyHook, unsetPropertyHook } from "@/common/Reflection";
import { tools } from "@/composable/useCardOpeners";
import { useWorker } from "@/composable/useWorker";
import { MessageType, ModerationType } from "@/site/twitch.tv";
import { useChatAPI } from "@/site/twitch.tv/ChatAPI";
import ChatData from "@/site/twitch.tv/modules/chat/ChatData.vue";
import ChatList from "@/site/twitch.tv/modules/chat/ChatList.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const props = defineProps<{
	list: HookedInstance<Twitch.ChatListComponent>;
	controller: HookedInstance<Twitch.ChatControllerComponent>;
	room: HookedInstance<Twitch.ChatRoomComponent>;
}>();

const store = useStore();
const { channel } = storeToRefs(store);
const { sendMessage } = useWorker();

const { list, controller, room } = toRefs(props);

const el = document.createElement("seventv-container");
el.id = "seventv-chat-controller";

const containerEl = ref<HTMLElement>(el);
const replacedEl = ref<Element | null>(null);

const bounds = ref<DOMRect>(el.getBoundingClientRect());

const scroller = ref<InstanceType<typeof UiScrollable> | undefined>();

watch(channel, (channel) => {
	if (!channel) {
		return;
	}

	log.info("<ChatController>", `Joining #${channel.username}`);
});

const chatAPI = useChatAPI(scroller, bounds);
const { scrollBuffer, scrollPaused, messages, lineLimit, twitchBadgeSets, clear, primaryColorHex } = chatAPI;

const dataSets = reactive({
	badges: false,
});

// Defines the current channel for hooking
const currentChannel = ref<CurrentChannel | null>(null);

// Capture the chat root node
watchEffect(() => {
	if (!list.value.domNodes) return;

	const rootNode = list.value.domNodes.root;
	if (!rootNode) return;

	rootNode.classList.add("seventv-chat-list");

	containerEl.value = rootNode as HTMLElement;
});

// Update current channel globally
watchEffect(() => {
	if (currentChannel.value) {
		if (store.setChannel(currentChannel.value)) clear();
	}
});

// The message handler is hooked to render messages and prevent
// the native twitch renderer from rendering them
const messageHandler = ref<Twitch.MessageHandlerAPI | null>(null);

watch(
	messageHandler,
	(handler, old) => {
		if (handler !== old && old) {
			unsetPropertyHook(old, "handleMessage");
		} else if (handler) {
			defineFunctionHook(handler, "handleMessage", function (old, msg: Twitch.AnyMessage) {
				const t = Date.now() + getRandomInt(0, 1000);
				const msgData = Object.create({ seventv: true, t });
				for (const k of Object.keys(msg)) {
					msgData[k] = msg[k as keyof Twitch.AnyMessage];
				}

				const ok = onMessage(msgData);
				if (ok) return ""; // message was rendered by the extension

				// message was not rendered by the extension
				return old?.call(this, msg);
			});
		}
	},
	{ immediate: true },
);

// Keep track of props
definePropertyHook(list.value.component, "props", {
	value(v: typeof list.value.component.props) {
		messageHandler.value = v.messageHandlerAPI;

		if (!dataSets.badges) {
			// Find message to grab some data
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const msgItem = (v.children[0] as any | undefined)?.props as Twitch.ChatLineComponent["props"];
			if (!msgItem?.badgeSets?.count) return;

			twitchBadgeSets.value = msgItem.badgeSets;

			dataSets.badges = true;
		}
	},
});

// Retrieve and convert Twitch Emotes
//
// This processed is deferred to the worker asynchronously
// in order to reduce the load on the main thread.
const twitchEmoteSets = ref<Twitch.TwitchEmoteSet[]>([]);
watch(twitchEmoteSets, (sets) => {
	if (!sets.length) return;

	onTwitchEmotes();
});

const onTwitchEmotes = debounceFn(async () => {
	for (const set of twitchEmoteSets.value) {
		await until(useTimeout(50)).toBeTruthy(); // reduce the rate of conversion

		sendMessage("SYNC_TWITCH_SET", { input: set });
	}
}, 1000);

// Keep track of user chat config
definePropertyHook(room.value.component, "props", {
	value(v: typeof room.value.component.props) {
		chatAPI.primaryColorHex.value = "#" + v.primaryColorHex ?? "755ebc";
		chatAPI.useHighContrastColors.value = v.useHighContrastColors;
		chatAPI.showTimestamps.value = v.showTimestamps;
	},
});

// Keep track of chat state
definePropertyHook(controller.value.component, "props", {
	value(v: typeof controller.value.component.props) {
		if (v.channelID) {
			currentChannel.value = {
				id: v.channelID,
				username: v.channelLogin,
				display_name: v.channelDisplayName,
				loaded: false,
			};

			chatAPI.currentChannel.value = currentChannel.value;
		}

		// Keep track of chat props
		chatAPI.isModerator.value = v.isCurrentUserModerator;
		chatAPI.isVIP.value = v.isCurrentUserVIP;
		chatAPI.sendMessage.value = v.chatConnectionAPI.sendMessage;
		chatAPI.isDarkTheme.value = v.theme;

		// Parse twitch emote sets
		const data = v.emoteSetsData;
		if (!data || !data.emoteSets || data.loading) return;

		twitchEmoteSets.value = data.emoteSets;

		// Add the current user & channel owner to active chatters
		if (v.userID) {
			chatAPI.chatters.value[v.userID] = {};
			chatAPI.chatters.value[v.channelID] = {};
		}
	},
});

// Keep track of unhandled nodes
const nodeMap = new Map<string, Element>();

// Watch for updated dom nodes on unhandled message components
watch(list.value.domNodes, (nodes) => {
	const missingIds = new Set<string>(nodeMap.keys()); // ids of messages that are no longer rendered

	for (const [nodeId, node] of Object.entries(nodes)) {
		if (nodeId === "root") continue;
		missingIds.delete(nodeId);

		if (nodeMap.has(nodeId)) continue;

		chatAPI.addMessage({
			id: nodeId + "-unhandled",
			element: node,
		} as Twitch.DisplayableMessage);

		nodeMap.set(nodeId, node);
	}

	for (const nodeId of missingIds) {
		nodeMap.delete(nodeId);
	}
});

// Determine if the message should performe some action or be sendt to the chatAPI for rendering
const onMessage = (msg: Twitch.AnyMessage): boolean => {
	if (msg.id === "seventv-hook-message") {
		return false;
	}

	switch (msg.type) {
		case MessageType.MESSAGE:
		case MessageType.SUBSCRIPTION:
		case MessageType.RESUBSCRIPTION:
		case MessageType.SUBGIFT:
		case MessageType.RAID:
		case MessageType.SUBMYSTERYGIFT:
		case MessageType.CHANNELPOINTSREWARD:
		case MessageType.ANNOUNCEMENTMESSAGE:
			onChatMessage(msg as Twitch.DisplayableMessage);
			break;
		case MessageType.MODERATION:
			onModerationMessage(msg as Twitch.ModerationMessage);
			break;
		default:
			return false;
	}
	return true;
};

function onChatMessage(msg: Twitch.DisplayableMessage) {
	// Add message to store
	// it will be rendered on the next tick
	chatAPI.addMessage(msg);
}

function onModerationMessage(msg: Twitch.ModerationMessage) {
	if (msg.moderationType == ModerationType.DELETE) {
		const found = messages.value.find((m) => m.id == msg.targetMessageID);
		if (found) {
			if (found.deleted !== undefined) found.deleted = true;
			if (found.message?.deleted !== undefined) found.message.deleted = true;
		}
	} else {
		messages.value.forEach((m) => {
			if (!m.seventv || m.user?.userLogin != msg.userLogin) return;
			if (m.banned !== undefined) m.banned = true;
			if (m.message?.banned !== undefined) m.message.banned = true;
		});
	}
}

awaitComponents<Twitch.ViewerCardComponent>({
	parentSelector: ".stream-chat",
	predicate: (n) => n.onShowViewerCard && n.onShowExtensionMessageCard,
}).then(([c]) => {
	if (!c) return;
	tools.onShowViewerCard = c.onShowViewerCard;
	tools.onShowEmoteCard = c.onShowEmoteCard;
	tools.setViewerCardPage = c.setViewerCardPage;
});

// Apply new boundaries when the window is resized
const resizeObserver = new ResizeObserver(() => {
	bounds.value = containerEl.value.getBoundingClientRect();
});
resizeObserver.observe(containerEl.value);

onUnmounted(() => {
	resizeObserver.disconnect();

	el.remove();
	if (replacedEl.value) replacedEl.value.classList.remove("seventv-checked");

	log.debug("<ChatController> Unmounted");

	// Unset hooks
	unsetPropertyHook(list.value.component.props, "messageHandlerAPI");
	unsetPropertyHook(list.value.component, "props");
	unsetPropertyHook(controller.value.component, "props");
	unsetPropertyHook(room.value.component, "props");
});
</script>

<style lang="scss">
seventv-container.seventv-chat-list {
	display: flex;
	flex-direction: column !important;
	-webkit-box-flex: 1 !important;
	flex-grow: 1 !important;
	overflow: auto !important;
	overflow-x: hidden !important;

	> seventv-container {
		display: none;
	}

	.seventv-message-container {
		padding: 1em 0;
		line-height: 1.5em;

		--seventv-primary-color: v-bind(primaryColorHex);
	}

	// Chat padding
	&.custom-scrollbar {
		scrollbar-width: none;

		&::-webkit-scrollbar {
			width: 0;
			height: 0;
		}

		.seventv-scrollbar {
			$width: 1em;

			position: absolute;
			right: 0;
			width: $width;
			overflow: hidden;
			border-radius: 0.33em;
			background-color: black;

			> .seventv-scrollbar-thumb {
				position: absolute;
				width: 100%;

				background-color: rgb(77, 77, 77);
			}
		}
	}

	.seventv-message-buffer-notice {
		cursor: pointer;
		position: absolute;
		bottom: 8em;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5em;
		border-radius: 0.33em;
		color: #fff;
		background-color: rgba(0, 0, 0, 50%);
		backdrop-filter: blur(0.05em);
	}
}

.community-highlight {
	background-color: var(--seventv-background-transparent-1) !important;
	backdrop-filter: blur(1em);
	transition: background-color 0.25s;

	&:hover {
		opacity: 1;
	}
}

.chat-list--default.seventv-checked {
	display: none !important;
}
</style>
