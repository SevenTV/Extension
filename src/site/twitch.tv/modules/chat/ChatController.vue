<!-- eslint-disable no-fallthrough -->
<template>
	<Teleport v-if="channel && channel.id" :to="containerEl">
		<UiScrollable ref="scrollerRef" @container-scroll="scroller.onScroll" @container-wheel="scroller.onWheel">
			<div id="seventv-message-container" class="seventv-message-container">
				<ChatList ref="chatList" :list="list" :message-handler="messageHandler" />
			</div>

			<!-- New Messages during Scrolling Pause -->
			<div
				v-if="scroller.paused && messages.pauseBuffer.length > 0"
				class="seventv-message-buffer-notice"
				@click="scroller.unpause"
			>
				<PauseIcon />

				<span :class="{ capped: messages.pauseBuffer.length >= scroller.lineLimit }">
					{{ messages.pauseBuffer.length }}
				</span>
				<span>new messages</span>
			</div>
		</UiScrollable>

		<!-- Data Logic -->
		<ChatData />
	</Teleport>

	<ChatTray />
	<ChatPubSub />
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onUnmounted, reactive, ref, toRefs, watch, watchEffect } from "vue";
import { refDebounced, until, useTimeout } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { ObserverPromise } from "@/common/Async";
import { log } from "@/common/Logger";
import { HookedInstance, awaitComponents } from "@/common/ReactHooks";
import { definePropertyHook, unsetPropertyHook } from "@/common/Reflection";
import { ChatMessage } from "@/common/chat/ChatMessage";
import { useChatContext } from "@/composable/chat/useChatContext";
import { resetProviders } from "@/composable/chat/useChatEmotes";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useChatScroller } from "@/composable/chat/useChatScroller";
import { tools } from "@/composable/useCardOpeners";
import { useWorker } from "@/composable/useWorker";
import ChatData from "@/site/twitch.tv/modules/chat/ChatData.vue";
import ChatList from "@/site/twitch.tv/modules/chat/ChatList.vue";
import PauseIcon from "@/assets/svg/icons/PauseIcon.vue";
import ChatPubSub from "./ChatPubSub.vue";
import ChatTray from "./ChatTray.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const props = defineProps<{
	list: HookedInstance<Twitch.ChatListComponent>;
	controller: HookedInstance<Twitch.ChatControllerComponent>;
	room: HookedInstance<Twitch.ChatRoomComponent>;
}>();

const store = useStore();
const { channel } = storeToRefs(store);
const { sendMessage: sendWorkerMessage } = useWorker();

const { list, controller, room } = toRefs(props);

const el = document.createElement("seventv-container");
el.id = "seventv-chat-controller";

const chatList = ref<InstanceType<typeof ChatList> | undefined>();
const containerEl = ref<HTMLElement>(el);
const replacedEl = ref<Element | null>(null);

const bounds = ref<DOMRect>(el.getBoundingClientRect());
const scrollerRef = ref<InstanceType<typeof UiScrollable> | undefined>();

watch(channel, (channel) => {
	if (!channel) {
		return;
	}

	log.info("<ChatController>", `Joining #${channel.username}`);
});

const scroller = useChatScroller({
	scroller: scrollerRef,
	bounds: bounds,
});
const context = useChatContext();
const messages = useChatMessages();
const properties = useChatProperties();

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

const dataSets = reactive({
	badges: false,
});

const messageHandler = ref<Twitch.MessageHandlerAPI | null>(null);
definePropertyHook(props.list.component, "props", {
	value(v) {
		messageHandler.value = v.messageHandlerAPI;
		if (!dataSets.badges) {
			// Find message to grab some data
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const msgItem = (v.children[0] as any | undefined)?.props as Twitch.ChatLineComponent["props"];
			if (!msgItem?.badgeSets?.count) return;

			properties.twitchBadgeSets = msgItem.badgeSets;

			dataSets.badges = true;
		}
	},
});

// Update current channel globally
function onUpdateChannel() {
	if (!store.setChannel(currentChannel.value)) return;

	messages.clear();
	scroller.unpause();

	nextTick(() => {
		resetProviders();
		hookMessageBuffer();
	});
}

// Retrieve and convert Twitch Emotes
//
// This processed is deferred to the worker asynchronously
// in order to reduce the load on the main thread.
const twitchEmoteSets = ref<Twitch.TwitchEmoteSet[]>([]);
const twitchEmoteSetsDbc = refDebounced(twitchEmoteSets, 1000);
watch(twitchEmoteSetsDbc, async (sets) => {
	if (!sets.length) return;

	for (const set of twitchEmoteSets.value) {
		sendWorkerMessage("SYNC_TWITCH_SET", { input: set });
	}
});

// Keep track of user chat config
definePropertyHook(room.value.component, "props", {
	value(v) {
		properties.primaryColorHex = v.primaryColorHex;
		properties.useHighContrastColors = v.useHighContrastColors;
		properties.showTimestamps = v.showTimestamps;
		properties.showModerationIcons = v.showModerationIcons;
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

			context.channel = currentChannel.value;
			onUpdateChannel();
		}

		// Keep track of chat props
		properties.isModerator = v.isCurrentUserModerator;
		properties.isVIP = v.isCurrentUserVIP;
		properties.isDarkTheme = v.theme;
		messages.setMessageSender(v.chatConnectionAPI.sendMessage);

		// Parse twitch emote sets
		const data = v.emoteSetsData;
		if (!data || !data.emoteSets || data.loading) return;

		twitchEmoteSets.value = data.emoteSets;

		// Add the current user & channel owner to active chatters
		if (v.userID) {
			messages.chatters[v.userID] = {};
			messages.chatters[v.channelID] = {};
		}
	},
});

const a = awaitComponents<Twitch.ViewerCardComponent>({
	parentSelector: ".stream-chat",
	predicate: (n) => n.onShowViewerCard && n.onShowExtensionMessageCard,
});

a.then(
	([c]) => {
		if (!c) return;
		tools.onShowViewerCard = c.onShowViewerCard;
		tools.onShowEmoteCard = c.onShowEmoteCard;
		tools.setViewerCardPage = c.setViewerCardPage;
	},
	() => null,
);

if (a instanceof ObserverPromise) {
	until(useTimeout(1e4))
		.toBeTruthy()
		.then(() => a.disconnect());
}

// Keep track of unhandled nodes
const nodeMap = new Map<string, Element>();

let unhandledStopper: () => void;

function watchUnhandled() {
	if (unhandledStopper) unhandledStopper();

	// Watch for updated dom nodes on unhandled message components
	unhandledStopper = watch(list.value.domNodes, (nodes) => {
		const missingIds = new Set<string>(nodeMap.keys()); // ids of messages that are no longer rendered

		for (const [nodeId, node] of Object.entries(nodes)) {
			if (nodeId === "root") continue;
			missingIds.delete(nodeId);

			if (nodeMap.has(nodeId)) continue;

			const m = new ChatMessage(nodeId + "-unhandled");
			m.wrappedNode = node;
			messages.add(m);

			nodeMap.set(nodeId, node);
		}

		for (const nodeId of missingIds) {
			nodeMap.delete(nodeId);
		}
	});
}

const messageBufferComponent = ref<Twitch.MessageBufferComponent | null>(null);
const messageBufferComponentDbc = refDebounced(messageBufferComponent, 200);

watch(messageBufferComponentDbc, (msgBuf, old) => {
	if (old && msgBuf !== old) {
		unsetPropertyHook(old, "buffer");
		unsetPropertyHook(old, "blockedUsers");
	} else if (msgBuf) {
		definePropertyHook(msgBuf, "buffer", {
			value(buffer) {
				// Wait until historical messages have loaded
				if (msgBuf.props.isLoadingHistoricalMessages) return;

				const historical = [] as ChatMessage[];

				for (const msg of buffer) {
					const m = new ChatMessage(msg.id);

					// If the message is historical we add it to the array and continue
					if ((msg as Twitch.ChatMessage).isHistorical) {
						m.historical = true;
						chatList.value?.onChatMessage(m, msg as Twitch.ChatMessage, false);

						historical.push(m);
						nodeMap.set(msg.id, {} as Element);
						continue;
					}

					if (chatList.value && chatList.value.onMessage(msg)) nodeMap.set(msg.id, {} as Element);
				}

				messages.displayed = historical.concat(messages.displayed);

				watchUnhandled();

				nextTick(() => {
					// Instantly scroll to the bottom and stop hooking the buffer
					scroller.scrollToLive(0);
					unsetPropertyHook(msgBuf, "buffer");
				});
			},
		});
		definePropertyHook(msgBuf, "blockedUsers", {
			value(users) {
				properties.blockedUsers = users;
			},
		});
	}
});

async function hookMessageBuffer() {
	const result = awaitComponents<Twitch.MessageBufferComponent>({
		parentSelector: ".stream-chat",
		predicate: (n) => n.prependHistoricalMessages && n.buffer && n.blockedUsers,
	}).then(
		([i]) => {
			if (!i) return;

			messageBufferComponent.value = i;
		},
		() => watchUnhandled(),
	);

	if (result instanceof ObserverPromise) {
		until(useTimeout(1e4))
			.toBeTruthy()
			.then(() => result.disconnect());
	}
}

// Apply new boundaries when the window is resized
const resizeObserver = new ResizeObserver(() => {
	bounds.value = containerEl.value.getBoundingClientRect();
});
resizeObserver.observe(containerEl.value);

onBeforeUnmount(() => {
	messages.clear();
});

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

const primaryColor = computed(() => `#${properties.primaryColorHex ?? "755ebc"}`);
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
		line-height: 1.5em;

		--seventv-primary-color: v-bind(primaryColor);
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
		bottom: 1em;
		left: 50%;
		transform: translateX(-50%);
		display: block;
		white-space: nowrap;
		padding: 0.5em;
		border-radius: 0.33em;
		color: #fff;
		background-color: rgba(0, 0, 0, 50%);
		outline: 0.25rem solid var(--seventv-muted);

		span:nth-of-type(1) {
			margin-right: 0.25rem;

			&.capped::after {
				content: "+";
			}
		}

		span,
		svg {
			display: inline-block;
			vertical-align: middle;
		}

		svg {
			font-size: 1.5rem;
			margin-right: 0.5em;
		}

		@at-root .seventv-transparent & {
			backdrop-filter: blur(0.5em);
		}
	}
}

.community-highlight {
	background-color: var(--seventv-background-transparent-1) !important;
	@at-root .seventv-transparent & {
		backdrop-filter: blur(1em);
	}
	transition: background-color 0.25s;

	&:hover {
		opacity: 1;
	}
}

.chat-list--default.seventv-checked {
	display: none !important;
}
</style>
