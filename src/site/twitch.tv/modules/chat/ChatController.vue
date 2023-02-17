<!-- eslint-disable no-fallthrough -->
<template>
	<Teleport v-if="ctx.id" :to="containerEl">
		<UiScrollable
			ref="scrollerRef"
			@container-scroll="scroller.onScroll"
			@container-wheel="scroller.onWheel"
			@mouseenter="properties.hovering = true"
			@mouseleave="properties.hovering = false"
		>
			<div id="seventv-message-container" class="seventv-message-container">
				<ChatList ref="chatList" :list="list" :message-handler="messageHandler" />
			</div>

			<!-- New Messages during Scrolling Pause -->
			<div v-if="scroller.paused" class="seventv-message-buffer-notice" @click="scroller.unpause">
				<PauseIcon />

				<span
					v-if="scroller.pauseBuffer.length"
					:class="{ capped: scroller.pauseBuffer.length >= scroller.lineLimit }"
				>
					{{ scroller.pauseBuffer.length }}
				</span>
				<span>{{ scroller.pauseBuffer.length > 0 ? "new messages" : "Chat Paused" }}</span>
			</div>
		</UiScrollable>

		<!-- Data Logic -->
		<ChatData v-if="ctx.loaded" />
	</Teleport>

	<ChatTray />
	<ChatPubSub />
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onUnmounted, reactive, ref, toRefs, watch, watchEffect } from "vue";
import { refDebounced, until, useTimeout } from "@vueuse/core";
import { ObserverPromise } from "@/common/Async";
import { log } from "@/common/Logger";
import { HookedInstance, awaitComponents } from "@/common/ReactHooks";
import { defineFunctionHook, definePropertyHook, unsetPropertyHook } from "@/common/Reflection";
import { ChatMessage } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useChatScroller } from "@/composable/chat/useChatScroller";
import { useChatTools } from "@/composable/chat/useChatTools";
import { getModule } from "@/composable/useModule";
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
	buffer?: HookedInstance<Twitch.MessageBufferComponent>;
}>();

const mod = getModule("chat")!;
const { sendMessage: sendWorkerMessage } = useWorker();

const { list, controller, room } = toRefs(props);

const el = document.createElement("seventv-container");
el.id = "seventv-chat-controller";

const chatList = ref<InstanceType<typeof ChatList> | undefined>();
const containerEl = ref<HTMLElement>(el);
const replacedEl = ref<Element | null>(null);

const bounds = ref<DOMRect>(el.getBoundingClientRect());
const scrollerRef = ref<InstanceType<typeof UiScrollable> | undefined>();

const primaryColor = ref("");

const ctx = useChannelContext(props.controller.component.props.channelID);
const worker = useWorker();
const emotes = useChatEmotes(ctx);
const messages = useChatMessages(ctx);
const scroller = useChatScroller(ctx, {
	scroller: scrollerRef,
	bounds: bounds,
});
const properties = useChatProperties(ctx);
const tools = useChatTools(ctx);

// Defines the current channel for hooking
const currentChannel = ref<CurrentChannel | null>(null);

// Capture the chat root node
watchEffect(() => {
	if (!list.value || !list.value.domNodes) return;

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
		primaryColor.value = `#${v.primaryColorHex ?? "755ebc"}`;

		properties.useHighContrastColors = v.useHighContrastColors;
		properties.showTimestamps = v.showTimestamps;
		properties.showModerationIcons = v.showModerationIcons;

		properties.pauseReason.clear();
		properties.pauseReason.add("SCROLL");
		switch (v.chatPauseSetting) {
			case "MOUSEOVER_ALTKEY":
				properties.pauseReason.add("ALTKEY");
				properties.pauseReason.add("MOUSEOVER");
				break;
			case "MOUSEOVER":
				properties.pauseReason.add("MOUSEOVER");
				break;
			case "ALTKEY":
				properties.pauseReason.add("ALTKEY");
				break;
		}
	},
});

// Keep track of chat state
definePropertyHook(controller.value.component, "props", {
	value(v: typeof controller.value.component.props) {
		if (v.channelID) {
			currentChannel.value = {
				id: v.channelID,
				username: v.channelLogin,
				displayName: v.channelDisplayName,
			};
		}

		// Keep track of chat props
		properties.isModerator = v.isCurrentUserModerator;
		properties.isVIP = v.isCurrentUserVIP;
		properties.isDarkTheme = v.theme;

		// Send presence upon message sent
		messages.sendMessage = v.chatConnectionAPI.sendMessage;
		defineFunctionHook(v.chatConnectionAPI, "sendMessage", function (old, ...args) {
			worker.sendMessage("CHANNEL_ACTIVE_CHATTER", {
				channel_id: ctx.id,
			});

			// Run message content patching middleware
			for (const fn of mod.instance?.messageSendMiddleware ?? []) {
				args[0] = fn(args[0]);
			}

			return old?.apply(this, args);
		});

		// Parse twitch emote sets
		const data = v.emoteSetsData;
		if (!data || !data.emoteSets || data.loading) return;

		twitchEmoteSets.value = data.emoteSets;
	},
});

const a = awaitComponents<Twitch.MessageCardOpeners>({
	parentSelector: ".stream-chat",
	predicate: (n) => n.props && n.props.onShowViewerCard,
});

a.then(
	([c]) => {
		if (!c) return;
		tools.update("TWITCH", "onShowViewerCard", c.props.onShowViewerCard);
	},
	() => null,
);

if (a instanceof ObserverPromise) {
	until(useTimeout(1e4))
		.toBeTruthy()
		.then(() => a.disconnect());
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
					if ((msg as Twitch.ChatMessage).isHistorical || msg.type > 0) {
						m.historical = true;
						chatList.value?.onChatMessage(m, msg as Twitch.ChatMessage, false);

						historical.push(m);
						continue;
					}
				}

				messages.displayed = historical.concat(messages.displayed);

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

// Watch change of current channel
watch(
	currentChannel,
	(chan) => {
		if (!chan || !ctx.setCurrentChannel(chan)) return;

		messages.clear();
		scroller.unpause();

		nextTick(() => emotes.resetProviders());
	},
	{ immediate: true },
);

// Capture the message buffer
watch(
	() => props.buffer,
	(msgBuffer) => {
		const msgBuf = msgBuffer?.component;
		if (!msgBuf) return;

		messageBufferComponent.value = msgBuf;
	},
	{ immediate: true },
);

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
