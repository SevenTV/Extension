<!-- eslint-disable no-fallthrough -->
<template>
	<Teleport v-if="ctx.id" :to="containerEl">
		<UiScrollable
			ref="scrollerRef"
			class="seventv-chat-scroller"
			:style="{ fontFamily: properties.fontAprilFools }"
			@container-scroll="scroller.onScroll"
			@container-wheel="scroller.onWheel"
			@mouseenter="properties.hovering = true"
			@mouseleave="properties.hovering = false"
		>
			<div id="seventv-message-container" class="seventv-message-container">
				<ChatList
					ref="chatList"
					:list="list"
					:restrictions="restrictions"
					:shared-chat-data="sharedChatDataByChannelID"
					:message-handler="messageHandler"
				/>
			</div>

			<!-- New Messages during Scrolling Pause -->
			<div v-if="scroller.paused" class="seventv-message-buffer-notice" @click="scroller.unpause">
				<PauseIcon />

				<span v-if="scroller.pauseBuffer.length" :class="{ capped: scroller.pauseBuffer.length >= lineLimit }">
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
import { nextTick, onBeforeUnmount, onUnmounted, ref, toRaw, toRefs, watch, watchEffect } from "vue";
import { refDebounced, until, useTimeout } from "@vueuse/core";
import { ObserverPromise } from "@/common/Async";
import { log } from "@/common/Logger";
import { HookedInstance, awaitComponents } from "@/common/ReactHooks";
import { defineFunctionHook, definePropertyHook, unsetPropertyHook } from "@/common/Reflection";
import { ChatMessage } from "@/common/chat/ChatMessage";
import { ChannelContext, ChannelRole, useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useChatScroller } from "@/composable/chat/useChatScroller";
import { useChatTools } from "@/composable/chat/useChatTools";
import { getModule } from "@/composable/useModule";
import { useConfig } from "@/composable/useSettings";
import { useWorker } from "@/composable/useWorker";
import { MessageType } from "@/site/twitch.tv";
import ChatList from "@/site/twitch.tv/modules/chat/ChatList.vue";
import PauseIcon from "@/assets/svg/icons/PauseIcon.vue";
import ChatPubSub from "./ChatPubSub.vue";
import ChatTray from "./components/tray/ChatTray.vue";
import ChatData from "@/app/chat/ChatData.vue";
import BasicSystemMessage from "@/app/chat/msg/BasicSystemMessage.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const props = defineProps<{
	controller: HookedInstance<Twitch.ChatControllerComponent>;
	room: HookedInstance<Twitch.ChatRoomComponent>;
	list: HookedInstance<Twitch.ChatListComponent>;
	buffer?: HookedInstance<Twitch.MessageBufferComponent>;
	events?: HookedInstance<Twitch.ChatEventComponent>;
	presentation?: HookedInstance<Twitch.ChatListPresentationComponent>;
	restrictions?: HookedInstance<Twitch.ChatRestrictionsComponent>;
}>();

const mod = getModule<"TWITCH", "chat">("chat")!;
const { sendMessage: sendWorkerMessage } = useWorker();

const { list, controller, room, presentation } = toRefs(props);

const el = document.createElement("seventv-container");
el.id = "seventv-chat-controller";

const chatList = ref<InstanceType<typeof ChatList> | undefined>();
const containerEl = ref<HTMLElement>(el);
const replacedEl = ref<Element | null>(null);

const bounds = ref<DOMRect>(el.getBoundingClientRect());
const scrollerRef = ref<InstanceType<typeof UiScrollable> | undefined>();

const primaryColor = ref("");

const ctx = useChannelContext(props.controller.component.props.channelID, true);
ctx.setCurrentChannel({ ...ctx.base, id: ctx.id });
const worker = useWorker();
const emotes = useChatEmotes(ctx);
const messages = useChatMessages(ctx);
const scroller = useChatScroller(ctx, {
	scroller: scrollerRef,
	bounds: bounds,
});
const properties = useChatProperties(ctx);
const tools = useChatTools(ctx);

// line limit
const lineLimit = useConfig("chat.line_limit", 150);
const ignoreClearChat = useConfig<boolean>("chat.ignore_clear_chat");

// Defines the current channel for hooking
const currentChannel = ref<CurrentChannel | null>(null);
const sharedChannels = new Map<string, ChannelContext>();

// get the config chat.font-april-fools
const fontAprilFools = useConfig("chat.font-april-fools", false);

watch(
	fontAprilFools,
	(value) => {
		properties.fontAprilFools = value === false ? "Comic Sans MS, Comic Sans, cursive" : "inherit";
	},
	{ immediate: true },
);

// Capture the chat root node
watchEffect(() => {
	if (!list.value || !list.value.domNodes) return;

	const rootNode = list.value.domNodes.root;
	if (!rootNode) return;

	rootNode.classList.add("seventv-chat-list");

	containerEl.value = rootNode as HTMLElement;
});

const messageHandler = ref<Twitch.MessageHandlerAPI | null>(null);

watch(
	list,
	(inst, old) => {
		if (!inst || !inst.component) return;

		if (old && old.component && inst !== old) {
			unsetPropertyHook(old.component, "props");
			return;
		}

		definePropertyHook(inst.component, "props", {
			value(v) {
				messageHandler.value = v.messageHandlerAPI;
			},
		});
	},
	{ immediate: true },
);

// Retrieve and convert Twitch Emotes
//
// This processed is deferred to the worker asynchronously
// in order to reduce the load on the main thread.
const twitchEmoteSets = ref<Twitch.TwitchEmoteSet[]>([]);
const twitchEmoteSetsDbc = refDebounced(twitchEmoteSets, 1000);
watch(twitchEmoteSetsDbc, async (sets) => {
	if (!sets.length) return;

	for (const set of twitchEmoteSets.value) {
		// Skip set if its injected by FFZ or BTTV for Slate autocomplete.
		if (set.id === "FrankerFaceZWasHere" || set.id === "BETTERTTV_EMOTES") continue;

		sendWorkerMessage("SYNC_TWITCH_SET", { input: toRaw(set) });
	}
});

// Keep track of user chat config
watch(
	room,
	(inst, old) => {
		if (!inst || !inst.component) return;

		if (old && old.component && inst !== old) {
			unsetPropertyHook(old.component, "props");
		}

		definePropertyHook(room.value.component, "props", {
			value(v) {
				properties.twitchBadgeSets = v.badgeSets;
				properties.primaryColorHex = v.primaryColorHex;
				primaryColor.value = `#${v.primaryColorHex ?? "755ebc"}`;
				document.body.style.setProperty("--seventv-channel-accent", primaryColor.value);

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
	},
	{ immediate: true },
);

// Keep track of chat state
definePropertyHook(controller.value.component, "props", {
	value(v: typeof controller.value.component.props) {
		if (v.channelID) {
			currentChannel.value = {
				id: v.channelID,
				username: v.channelLogin,
				displayName: v.channelDisplayName,
				active: true,
			};
		}

		const temp = new Set<ChannelRole>();
		for (const [role, ok] of [
			["VIP", v.isCurrentUserVIP],
			["EDITOR", v.isCurrentUserEditor],
			["MODERATOR", v.isCurrentUserModerator || v.channelID === v.userID],
			["BROADCASTER", v.channelID === v.userID],
		] as [ChannelRole, boolean][]) {
			if (!ok) continue;
			temp.add(role);
		}

		ctx.actor.roles = temp;

		// Keep track of chat props
		properties.isDarkTheme = v.theme;

		// Send presence upon message sent
		messages.sendMessage = v.chatConnectionAPI.sendMessage;
		defineFunctionHook(v.chatConnectionAPI, "sendMessage", function (old, ...args) {
			if (sharedChatDataByChannelID.value?.size != 0) {
				for (const [key, value] of sharedChatDataByChannelID.value?.entries() ?? []) {
					worker.sendMessage("CHANNEL_ACTIVE_CHATTER", {
						channel: {
							id: key,
							username: value.login,
							displayName: value.displayName,
							active: true,
						},
					});
				}
			} else {
				worker.sendMessage("CHANNEL_ACTIVE_CHATTER", {
					channel: toRaw(ctx.base),
				});
			}

			// Run message content patching middleware
			for (const fn of mod.instance?.messageSendMiddleware.values() ?? []) {
				args[0] = fn(args[0]);
			}

			return old?.apply(this, args);
		});

		// Parse twitch emote sets
		const data = v.emoteSetsData;
		if (!data || data.loading) return;

		twitchEmoteSets.value = data.emoteSets;
	},
});

const sharedChatDataByChannelID = ref<Map<string, Twitch.SharedChat> | null>(null);
watch(
	presentation,
	(inst, old) => {
		if (!inst || !inst.component) return;

		if (old && old.component && inst !== old) {
			unsetPropertyHook(old.component, "props");
			return;
		}

		definePropertyHook(inst.component, "props", {
			value(v) {
				sharedChatDataByChannelID.value = v.sharedChatDataByChannelID;

				for (const channelID of sharedChatDataByChannelID.value.keys()) {
					if (!sharedChannels.has(channelID) && channelID != ctx.id) {
						sharedChannels.set(channelID, useChannelContext(channelID, true));
					}
				}
			},
		});
	},
	{ immediate: true },
);

const a = awaitComponents<Twitch.MessageCardOpeners>({
	parentSelector: ".stream-chat",
	predicate: (n) => {
		return n.props && (n.props.onShowViewerCard || n.openUserCard);
	},
});

a.then(
	([c]) => {
		if (!c) return;
		tools.update("TWITCH", "onShowViewerCard", c.props.onShowViewerCard ?? c.openUserCard);
	},
	() => null,
);

tools.update(
	"TWITCH",
	"onShowViewerWarnPopover",
	(userId: string, userLogin: string, placement: Twitch.WarnUserPopoverPlacement) => {
		const props = controller.value.component.props;
		props.setWarnUserTarget({
			targetUserID: userId,
			targetUserLogin: userLogin,
		});
		props.setWarnUserPopoverPlacement(placement);
	},
);

if (a instanceof ObserverPromise) {
	until(useTimeout(1e4))
		.toBeTruthy()
		.then(() => a.disconnect());
}

const messageBufferComponent = ref<Twitch.MessageBufferComponent | null>(null);
const messageBufferComponentDbc = refDebounced(messageBufferComponent, 100);

const isLoadingHistoricalMessages = ref(true);
watch(isLoadingHistoricalMessages, (isLoading) => {
	const buffer = messageBufferComponent.value?.buffer;
	if (isLoading || !buffer) return;
	handleBuffer(buffer);
});

function handleBuffer(buffer: Twitch.MessageBufferComponent["buffer"]) {
	if (!buffer.length) return;
	const historical: ChatMessage[] = [];

	for (const msg of buffer) {
		const m = new ChatMessage(msg.id);

		// If the message is historical we add it to the array and continue
		if ((msg as Twitch.ChatMessage).isHistorical || msg.type === MessageType.CONNECTED) {
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
	});
}

watch(messageBufferComponentDbc, (msgBuf, old) => {
	if (old && msgBuf !== old) {
		unsetPropertyHook(old, "blockedUsers");
		unsetPropertyHook(old, "props");
	} else if (msgBuf) {
		definePropertyHook(msgBuf, "props", {
			value(props) {
				isLoadingHistoricalMessages.value = props.isLoadingHistoricalMessages;
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

		nextTick(emotes.reset);
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

// Capture some chat events
const chatEventsComponent = ref<Twitch.ChatEventComponent | null>(null);
watch(
	() => props.events,
	(evt) => {
		if (!evt || !evt.component) return;

		chatEventsComponent.value = evt.component;
	},
	{ immediate: true },
);

watch(
	chatEventsComponent,
	(com, old) => {
		if (old) {
			unsetPropertyHook(old, "onClearChatEvent");
		}
		if (!com) return;

		defineFunctionHook(com, "onClearChatEvent", (f) => {
			const msg = new ChatMessage().setComponent(BasicSystemMessage, {
				text: ignoreClearChat.value ? "Chat clear prevented by 7TV" : "Chat cleared by a moderator",
			});
			if (!ignoreClearChat.value) messages.clear();
			messages.add(msg);

			// send back an empty channel
			// (this will make the chat clear on twitch's end a no-op; this avoids a crash due to the way we move unrendered messages)
			return f?.apply(this, [{ channel: "" }]);
		});
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
	unsetPropertyHook(controller.value.component, "props");
	if (list.value) {
		unsetPropertyHook(list.value.component.props, "messageHandlerAPI");
		unsetPropertyHook(list.value.component, "props");
	}
	if (room.value) unsetPropertyHook(room.value.component, "props");

	document.body.style.removeProperty("--seventv-channel-accent");
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
		color: currentcolor;
		background-color: var(--seventv-background-transparent-1);
		outline: 0.25rem solid var(--seventv-border-transparent-1);

		span,
		svg {
			display: inline-block;
			vertical-align: middle;
		}

		svg {
			font-size: 1.5rem;
			margin-right: 0.5em;
		}

		span:nth-of-type(1) {
			margin-right: 0.25rem;

			&.capped::after {
				content: "+";
			}
		}

		@at-root .seventv-transparent & {
			backdrop-filter: blur(0.5em);
		}
	}
}

.seventv-chat-scroller {
	z-index: 1;
	height: 100%;
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

/* stylelint-disable-next-line selector-class-pattern */
.chat-list--default.seventv-checked {
	display: none !important;
}

[data-a-target="emote-picker-button"] {
	overflow: unset !important;
}
</style>
