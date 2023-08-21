<template>
	<main ref="chatListEl" class="seventv-chat-list" :alternating-background="isAlternatingBackground">
		<div v-for="msg of displayedMessages" :key="msg.sym" :msg-id="msg.id" class="seventv-message">
			<template v-if="msg.instance">
				<component
					:is="isModSliderEnabled && ctx.actor.roles.has('MODERATOR') && msg.author ? ModSlider : 'span'"
					v-bind="{ msg }"
				>
					<component :is="msg.instance" v-slot="slotProps" v-bind="msg.componentProps" :msg="msg">
						<UserMessage
							v-bind="slotProps"
							:msg="msg"
							:emotes="emotes.active"
							:chatters="messages.chattersByUsername"
						/>
					</component>
				</component>
			</template>
			<template v-else>
				<ChatMessageUnhandled :msg="msg" />
			</template>
		</div>
	</main>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, toRef, watch } from "vue";
import { until, useDocumentVisibility, useMagicKeys, useTimeoutFn, watchDebounced } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { normalizeUsername } from "@/common/Color";
import { log } from "@/common/Logger";
import { HookedInstance } from "@/common/ReactHooks";
import { defineFunctionHook, unsetPropertyHook } from "@/common/Reflection";
import { convertCheerEmote, convertTwitchEmote } from "@/common/Transform";
import { ChatMessage, ChatMessageModeration, ChatUser } from "@/common/chat/ChatMessage";
import { IsChatMessage, IsDisplayableMessage, IsModerationMessage } from "@/common/type-predicates/Messages";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useChatHighlights } from "@/composable/chat/useChatHighlights";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useChatScroller } from "@/composable/chat/useChatScroller";
import { useConfig } from "@/composable/useSettings";
import { MessagePartType, MessageType, ModerationType } from "@/site/twitch.tv/";
import ChatMessageUnhandled from "./ChatMessageUnhandled.vue";
import ModSlider from "./components/mod/ModSlider.vue";
import UserMessage from "@/app/chat/UserMessage.vue";
import BasicSystemMessage from "@/app/chat/msg/BasicSystemMessage.vue";

const props = defineProps<{
	list: HookedInstance<Twitch.ChatListComponent>;
	messageHandler: Twitch.MessageHandlerAPI | null;
}>();

const ctx = useChannelContext();
const { identity } = storeToRefs(useStore());
const emotes = useChatEmotes(ctx);
const messages = useChatMessages(ctx);
const displayedMessages = toRef(messages, "displayed");
const scroller = useChatScroller(ctx);
const properties = useChatProperties(ctx);
const chatHighlights = useChatHighlights(ctx);
const pageVisibility = useDocumentVisibility();
const isHovering = toRef(properties, "hovering");
const pausedByVisibility = ref(false);

const isModSliderEnabled = useConfig<boolean>("chat.mod_slider");
const showModerationMessages = useConfig<boolean>("chat.mod_messages");
const isAlternatingBackground = useConfig<boolean>("chat.alternating_background");
const showMentionHighlights = useConfig("highlights.basic.mention");
const showFirstTimeChatter = useConfig<boolean>("highlights.basic.first_time_chatter");
const showSelfHighlights = useConfig<boolean>("highlights.basic.self");
const shouldPlaySoundOnMention = useConfig<boolean>("highlights.basic.mention_sound");
const shouldFlashTitleOnHighlight = useConfig<boolean>("highlights.basic.mention_title_flash");
const showRestrictedLowTrustUser = useConfig<boolean>("highlights.basic.restricted_low_trust_user");

const messageHandler = toRef(props, "messageHandler");
const list = toRef(props, "list");

// Unrender messages out of view
const chatListEl = ref<HTMLElement>();

const types = import.meta.glob<object>("@/app/chat/msg/*.vue", { eager: true, import: "default" });
const typeMap = {} as Record<number, ComponentFactory>;

const componentRegexp = /src\/app\/chat\/msg\/(\d+)\.(\w+)\.vue$/;
for (const [path, component] of Object.entries(types)) {
	const [, type] = path.match(componentRegexp) ?? [];
	if (!type) continue;

	const t = parseInt(type);
	if (Number.isNaN(t)) continue;

	typeMap[t] = component as ComponentFactory;
}

function getMessageComponent(type: MessageType) {
	return typeMap[type] ?? null;
}

// Determine if the message should perform some action or be sent to the chatAPI for rendering
const onMessage = (msgData: Twitch.AnyMessage): boolean => {
	const msg = new ChatMessage(msgData.id);

	msg.channelID = ctx.id;

	switch (msgData.type) {
		case MessageType.MESSAGE:
		case MessageType.SUBSCRIPTION:
		case MessageType.RESUBSCRIPTION:
		case MessageType.SUB_GIFT:
		case MessageType.RAID:
		case MessageType.SUB_MYSTERY_GIFT:
		case MessageType.CHANNEL_POINTS_REWARD:
		case MessageType.ANNOUNCEMENT_MESSAGE:
		case MessageType.RESTRICTED_LOW_TRUST_USER_MESSAGE:
		case MessageType.PAID_MESSAGE:
		case MessageType.CONNECTED:
			onChatMessage(msg, msgData);
			break;

		case MessageType.MODERATION:
			if (!IsModerationMessage(msgData)) break;

			onModerationMessage(msgData);
			break;
		case MessageType.MESSAGE_ID_UPDATE:
			onMessageIdUpdate(msgData as Twitch.IDUpdateMessage);
			break;
		default:
			return false;
	}

	// Send message to our registered message handlers
	messages.handlers.forEach((h) => h(msgData));

	return true;
};

function onChatMessage(msg: ChatMessage, msgData: Twitch.AnyMessage, shouldRender = true) {
	const c = getMessageComponent(msgData.type);
	if (c) {
		msg.setComponent(c, { msgData: msgData });
	}

	if (!msg.instance) {
		msg.setComponent(typeMap[0], { msgData: msgData });
	}

	if (msgData.type === MessageType.RESTRICTED_LOW_TRUST_USER_MESSAGE && showRestrictedLowTrustUser.value) {
		msg.setHighlight("#ff7d00", "Restricted Suspicious User");
	}

	// define message author
	const authorData = msgData.user ?? msgData.message?.user ?? null;
	if (authorData) {
		const knownChatter = messages.chatters[authorData.userID];
		const color = authorData.color
			? properties.useHighContrastColors
				? normalizeUsername(authorData.color, properties.isDarkTheme as 0 | 1)
				: authorData.color
			: null;

		if (knownChatter) {
			knownChatter.username = authorData.userLogin;
			knownChatter.displayName = authorData.userDisplayName ?? authorData.displayName ?? authorData.userLogin;
			knownChatter.color = color ?? knownChatter.color;
			knownChatter.intl = authorData.isIntl;
		}

		msg.setAuthor(
			knownChatter ?? {
				id: authorData.userID,
				username: authorData.userLogin ?? (authorData.userDisplayName ?? authorData.displayName)?.toLowerCase(),
				displayName: authorData.userDisplayName ?? authorData.displayName ?? authorData.userLogin,
				color,
			},
		);

		// check blocked state and ignore if blocked
		if (msg.author && properties.blockedUsers.has(msg.author.id)) {
			if (!ctx.actor.roles.has("MODERATOR")) {
				log.debug("Ignored message from blocked user", msg.author.id);
				return;
			}

			msg.setHighlight("#9488855A", "You Blocked This User");
		}

		if (identity.value && msg.author && msg.author.id === identity.value.id) {
			msg.author.isActor = true;
		}

		msg.badges = msgData.badges ?? msgData.message?.badges ?? {};
	}

	if (IsDisplayableMessage(msgData)) {
		msg.body = (msgData.messageBody ?? msgData.message?.messageBody ?? "").replace("\n", " ");

		if (typeof msgData.nonce === "string") msg.setNonce(msgData.nonce);

		// assign highlight
		if (msgData.isFirstMsg && showFirstTimeChatter.value) {
			msg.setHighlight("#c832c8", "First Message");
		} else if (msgData.isReturningChatter) {
			msg.setHighlight("#3296e6", "Returning Chatter");
		}

		// assign parent message data
		if (msgData.reply) {
			const parentMsgAuthor =
				msgData.reply.parentUserLogin && msgData.reply.parentDisplayName
					? {
							username: msgData.reply.parentUserLogin,
							displayName: msgData.reply.parentDisplayName,
					  }
					: null;

			msg.parent = {
				id: msgData.reply.parentMsgId,
				uid: msgData.reply.parentUid,
				deleted: msgData.reply.parentDeleted,
				body: msgData.reply.parentMessageBody,
				author: parentMsgAuthor,
			};

			// Highlight as a reply to the actor
			chatHighlights.checkMatch("~reply", msg);
		}

		// message is /me
		if (msgData.messageType === 1) {
			msg.slashMe = true;
		}

		// assign native emotes
		for (const part of msgData.messageParts ?? msgData.message?.messageParts ?? []) {
			switch (part.type) {
				// capture native emotes
				case MessagePartType.EMOTE: {
					const e = part.content as Twitch.ChatMessage.EmotePart["content"];
					if (!e.alt) continue;

					// skip over emotes patched in by FFZ and BTTV
					if (e.emoteID?.startsWith("__FFZ__") || e.emoteID?.startsWith("__BTTV__")) continue;

					msg.nativeEmotes[e.alt + (e.cheerAmount ?? "")] = {
						id: e.emoteID ?? "",
						name: e.alt,
						flags: 0,
						provider: "PLATFORM",
						isTwitchCheer: {
							amount: e.cheerAmount!,
							color: e.cheerColor!,
						},
						data: e.cheerAmount
							? convertCheerEmote({
									alt: e.alt,
									cheerAmount: e.cheerAmount,
									cheerColor: e.cheerColor,
									images: e.images,
							  })
							: convertTwitchEmote({
									id: e.emoteID,
									token: e.alt,
							  } as Partial<Twitch.TwitchEmote>),
					};
					break;
				}
				// replace flagged segments
				case MessagePartType.FLAGGEDSEGMENT: {
					const e = part as Twitch.ChatMessage.FlaggedSegmentPart;
					if (!e.originalText) continue;

					msg.body = msg.body.replace(e.originalText, "*".repeat(e.originalText.length));
					break;
				}
			}
		}
	}

	// message is sent by the current user
	if (msgData.nonce) {
		msg.setDeliveryState("IN_FLIGHT");

		// Set a timeout, beyond which we'll consider the message failed to send
		const { stop } = useTimeoutFn(() => {
			msg.setDeliveryState("BOUNCED");
		}, 1e4);

		until(ref(msg.deliveryState)).toBe("SENT").then(stop);
	}

	if (IsChatMessage(msgData)) msg.setTimestamp(msgData.timestamp);
	else if (msgData.message) msg.setTimestamp(msgData.message.timestamp ?? 0);

	// highlight when message mentions the actor
	for (const highlightID in chatHighlights.getAll()) {
		chatHighlights.checkMatch(highlightID, msg);
	}

	if (ctx.actor.roles.has("MODERATOR")) {
		msg.pinnable = true;
		msg.deletable = true;
	}

	// Add message to store
	// it will be rendered on the next tick
	if (shouldRender) messages.add(msg);
}

function onModerationMessage(msgData: Twitch.ModerationMessage) {
	if (msgData.moderationType === ModerationType.DELETE) {
		const found = messages.find((m) => m.id == msgData.targetMessageID);
		if (found) {
			found.moderation.deleted = true;
		}
	} else {
		const prev = messages.moderated[0];
		if (
			prev &&
			prev.victim &&
			prev.victim.username === msgData.userLogin &&
			prev.mod.banDuration === msgData.duration
		) {
			// skip duplicate moderation messages
			return;
		}

		const msgList = messages.messagesByUser(msgData.userLogin);

		const action = {
			actionType: msgData.duration > 0 ? "TIMEOUT" : "BAN",
			banDuration: msgData.duration,
			banReason: msgData.reason,
			actor: null,
			banned: true,
			deleted: false,
			timestamp: Date.now(),
		} as ChatMessageModeration;

		let victim: null | ChatUser = null;
		for (const m of msgList) {
			m.moderation = action;

			if (!victim) {
				victim = m.author as ChatUser;
			}
		}

		// add to moderation log
		messages.moderated.unshift({
			id: Symbol("seventv-moderation-message"),
			messages: msgList.reverse().slice(0, 10), // last 10 messages
			mod: action,
			victim: victim || {
				id: msgData.userLogin,
				username: msgData.userLogin,
				displayName: msgData.userLogin,
				color: "",
			},
		});

		// cleanup old logs
		if (messages.moderated.length > 125) {
			nextTick(() => {
				while (messages.moderated.length > 100) messages.moderated.pop();
			});
		}

		// basic timeout/ban message in the chat
		if (showModerationMessages.value && !ctx.actor.roles.has("MODERATOR")) {
			const m = new ChatMessage().setComponent(BasicSystemMessage, {
				text:
					msgData.userLogin +
					(msgData.duration > 0 ? ` was timed out (${msgData.duration}s)` : " was permanently banned"),
			});
			messages.add(m);
		}
	}
}

function onMessageIdUpdate(msg: Twitch.IDUpdateMessage) {
	const found = messages.find((m) => m.nonce == msg.nonce);
	if (found) {
		found.setID(msg.id);
		found.setDeliveryState("SENT");
	}
}

// Keep track of props

// The message handler is hooked to render messages and prevent
// the native twitch renderer from rendering them
watch(
	messageHandler,
	(handler, old) => {
		if (handler !== old && old) {
			unsetPropertyHook(old, "handleMessage");
		} else if (handler) {
			defineFunctionHook(handler, "handleMessage", function (old, msg: Twitch.AnyMessage) {
				const ok = onMessage(msg);
				if (ok) return ""; // message was rendered by the extension

				// message was not rendered by the extension
				unhandled.set(msg.id, msg);
				return old?.call(this, msg);
			});
		}
	},
	{ immediate: true },
);

// Keep track of unhandled nodes
const unhandled = reactive<Map<string, Twitch.AnyMessage>>(new Map());
const unhandledNodeMap = new Map<string, Element>();

watchDebounced(
	list.value.domNodes,
	(nodes) => {
		const missingIds = new Set<string>(unhandledNodeMap.keys()); // ids of messages that are no longer rendered

		for (const [nodeId, node] of Object.entries(nodes)) {
			if (nodeId === "root") continue;
			missingIds.delete(nodeId);
			if (unhandledNodeMap.has(nodeId) || !unhandled.has(nodeId)) continue;

			const m = new ChatMessage(nodeId + "-unhandled");
			m.wrappedNode = node;
			messages.add(m);

			unhandledNodeMap.set(nodeId, node);
		}

		for (const nodeId of missingIds) {
			unhandledNodeMap.delete(nodeId);
		}
	},
	{ debounce: 100, immediate: true },
);

// Scroll Pausing on hotkey / hover
const { alt } = useMagicKeys();

let pausedByHotkey = false;
watch([alt, isHovering], ([isAlt, isHover]) => {
	if (!scroller.paused) {
		if (isHover && properties.pauseReason.has("MOUSEOVER")) {
			scroller.pause();
			pausedByHotkey = true;
		} else if (isHover && isAlt && properties.pauseReason.has("ALTKEY")) {
			scroller.pause();
			pausedByHotkey = true;
		}
	} else if (pausedByHotkey) {
		scroller.unpause();
		pausedByHotkey = false;
	}
});

// Assign highlight to your own message
watch(
	[identity, showSelfHighlights],
	([identity, enabled]) => {
		if (enabled && identity) {
			chatHighlights.define("~self", {
				test: (msg) => !!(msg.author && identity) && msg.author.id === identity.id,
				label: "You",
				color: "#3ad3e0",
			});
		} else {
			chatHighlights.remove("~self");
		}
	},
	{
		immediate: true,
	},
);

// Pause scrolling when page is not visible
watch(pageVisibility, (state) => {
	if (state === "hidden" && !scroller.paused) {
		scroller.pause();
		pausedByVisibility.value = true;
	} else if (pausedByVisibility.value) {
		scroller.unpause();
		pausedByVisibility.value = false;
	}
});

watch(
	[identity, showMentionHighlights, shouldPlaySoundOnMention, shouldFlashTitleOnHighlight],
	([identity, enabled, sound, flash]) => {
		const rxs = identity ? `\\b${identity.username}\\b` : null;
		if (!rxs) return;

		const rx = new RegExp(rxs, "i");

		if (enabled) {
			chatHighlights.define("~mention", {
				test: (msg) =>
					!!(identity && msg.author && msg.author.username !== identity.username && rx.test(msg.body)),
				label: "Mentions You",
				color: "#e13232",
				soundPath: sound ? "#ping" : undefined,
				flashTitleFn: flash
					? (msg: ChatMessage) => `🔔 @${msg.author?.username ?? "A user"} mentioned you`
					: undefined,
				flashTitle: true,
			});

			chatHighlights.define("~reply", {
				test: (msg) =>
					!!(
						msg.parent &&
						msg.parent.author &&
						msg.author &&
						msg.author.username !== msg.parent.author.username &&
						rx.test(msg.parent.author.username)
					),
				label: "Replying to You",
				color: "#e13232",
				soundPath: sound ? "#ping" : undefined,
				flashTitleFn: flash
					? (msg: ChatMessage) => `🔔 @${msg.author?.username ?? "A user"} replied to you`
					: undefined,
				flashTitle: true,
			});
		} else {
			chatHighlights.remove("~mention");
			chatHighlights.remove("~reply");
		}
	},
	{
		immediate: true,
	},
);

defineExpose({
	onMessage,
	onChatMessage,
});
</script>
<style scoped lang="scss">
.seventv-chat-list {
	padding: 1rem 0;
	font-size: var(--seventv-chat-font-size, inherit);
	line-height: 1.5em;
}

.seventv-chat-list[alternating-background="true"] {
	.seventv-message:nth-child(even) {
		background-color: var(--seventv-chat-alternate-background-color);
	}
}
</style>
