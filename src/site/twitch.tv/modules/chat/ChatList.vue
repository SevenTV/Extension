<template>
	<main ref="chatListEl" class="seventv-chat-list" :alternating-background="isAlternatingBackground">
		<div
			v-for="(msg, index) of messages.displayed"
			:key="msg.id"
			v-memo="[msg]"
			:msg-id="msg.id"
			class="seventv-message"
			:class="{
				// Even-odd alternating background
				...(isAlternatingBackground
					? {
							even: index % 2 == 0,
							odd: index % 2 == 1,
					  }
					: {}),
			}"
		>
			<template v-if="msg.instance">
				<ModSlider v-if="isModSliderEnabled && properties.isModerator && msg.author" :msg="msg">
					<component :is="msg.instance" v-bind="msg.componentProps" :msg="msg">
						<UserMessage :msg="msg" />
					</component>
				</ModSlider>

				<component :is="msg.instance" v-else v-bind="msg.componentProps" :msg="msg">
					<UserMessage :msg="msg" />
				</component>
			</template>
			<template v-else>
				<ChatMessageUnhandled :msg="msg" />
			</template>
		</div>
	</main>
</template>

<script setup lang="ts">
import { ref, toRef, watch } from "vue";
import { until, useDocumentVisibility, useTimeoutFn } from "@vueuse/core";
import { useStore } from "@/store/main";
import { getRandomInt } from "@/common/Rand";
import { HookedInstance } from "@/common/ReactHooks";
import { defineFunctionHook, unsetPropertyHook } from "@/common/Reflection";
import { convertCheerEmote, convertTwitchEmote } from "@/common/Transform";
import { ChatMessage } from "@/common/chat/ChatMessage";
import { IsDisplayableMessage, IsModerationMessage } from "@/common/type-predicates/Messages";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useChatScroller } from "@/composable/chat/useChatScroller";
import { useConfig } from "@/composable/useSettings";
import { MessagePartType, MessageType, ModerationType } from "@/site/twitch.tv/";
import ChatMessageUnhandled from "./ChatMessageUnhandled.vue";
import UserMessage from "./components/message/UserMessage.vue";
import ModSlider from "./components/mod/ModSlider.vue";

const props = defineProps<{
	list: HookedInstance<Twitch.ChatListComponent>;
	messageHandler: Twitch.MessageHandlerAPI | null;
}>();

const store = useStore();
const messages = useChatMessages();
const scroller = useChatScroller();
const properties = useChatProperties();
const pageVisibility = useDocumentVisibility();

const isModSliderEnabled = useConfig<boolean>("chat.mod_slider");
const isAlternatingBackground = useConfig<boolean>("chat.alternating_background");

// Keep track of props

// The message handler is hooked to render messages and prevent
// the native twitch renderer from rendering them
const messageHandler = toRef(props, "messageHandler");

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

// Determine if the message should performe some action or be sendt to the chatAPI for rendering
const onMessage = (msgData: Twitch.AnyMessage): boolean => {
	const msg = new ChatMessage(msgData.id);
	const c = getMessageComponent(msgData.type);
	if (c) {
		msg.setComponent(c, { msgData: msgData });
	}

	msg.channelID = store.channel?.id ?? "";

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
	if (!msg.instance) {
		msg.setComponent(typeMap[0], { msgData: msgData });
	}

	if (msgData.type === MessageType.RESTRICTED_LOW_TRUST_USER_MESSAGE) {
		msg.setHighlight("#ff7d00", "Restricted Suspicious User");
	}

	if (IsDisplayableMessage(msgData)) {
		msg.body = (msgData.messageBody ?? msgData.message?.messageBody ?? "").replace("\n", " ");

		if (typeof msgData.nonce === "string") msg.setNonce(msgData.nonce);

		// assign highlight
		if (msgData.isFirstMsg) {
			msg.setHighlight("#c832c8", "First Message");
		} else if (msgData.isReturningChatter) {
			msg.setHighlight("#3296e6", "Returning Chatter");
		}

		// assign parent message data
		if (msgData.reply) {
			msg.parent = {
				id: msgData.reply.parentMsgId,
				uid: msgData.reply.parentUid,
				deleted: msgData.reply.parentDeleted,
				body: msgData.reply.parentMessageBody,
				author:
					msgData.reply.parentUserLogin && msgData.reply.parentDisplayName
						? {
								username: msgData.reply.parentUserLogin,
								displayName: msgData.reply.parentDisplayName,
						  }
						: null,
			};
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

					msg.nativeEmotes[e.alt + (e.cheerAmount ?? "")] = {
						id: e.emoteID ?? "",
						name: e.alt,
						flags: 0,
						provider: "TWITCH",
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

	// define message author
	const authorData = msgData.user ?? msgData.message?.user ?? null;
	if (authorData) {
		msg.setAuthor({
			id: authorData.userID,
			username: authorData.userLogin,
			displayName: authorData.userDisplayName ?? authorData.displayName ?? authorData.userLogin,
			color: authorData.color,
		});

		msg.badges = msgData.badges ?? msgData.message?.badges ?? {};

		if (!properties.isModerator && msg.author && properties.blockedUsers.has(msg.author.id)) {
			msg.setHighlight("#ff0000", "Blocked User");
		}
	}

	// message is sent by the current user
	if (msgData.nonce) {
		msg.setDeliveryState("IN_FLIGHT");

		// Set a timeout, beyond which we'll consider the message failed to send
		const { stop } = useTimeoutFn(() => {
			msg.setDeliveryState("BOUNCED");
		}, 10e3);

		until(ref(msg.deliveryState)).toBe("SENT").then(stop);
	}

	// Add message to store
	// it will be rendered on the next tick
	if (shouldRender) messages.add(msg);
}

function onModerationMessage(msgData: Twitch.ModerationMessage) {
	if (msgData.moderationType === ModerationType.DELETE) {
		const found = messages.find((m) => m.id == msgData.targetMessageID);
		if (found) {
			found.deleted = true;
		}
	} else {
		const msgList = messages.messagesByUser(msgData.userLogin);
		for (const m of msgList) {
			m.banned = true;
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

// Pause scrolling when page is not visible
const pausedByVisibility = ref(false);
watch(pageVisibility, (state) => {
	if (state === "hidden") {
		scroller.pause();
		pausedByVisibility.value = true;
	} else if (pausedByVisibility.value) {
		scroller.unpause();
		pausedByVisibility.value = false;
	}
});

// Unrender messages out of view
const chatListEl = ref<HTMLElement>();

const types = import.meta.glob<object>("./components/types/*.vue", { eager: true, import: "default" });
const typeMap = {} as Record<number, ComponentFactory>;

const componentRegexp = /\.\/components\/types\/(\d+)\.(\w+)\.vue$/;
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

defineExpose({
	onMessage,
	onChatMessage,
});
</script>
<style scoped lang="scss">
.seventv-chat-list[alternating-background="true"] {
	padding: 0.5em 0;

	.seventv-message.even {
		background-color: var(--seventv-background-shade-1);
	}

	.seventv-message.odd {
		background-color: var(--seventv-background-shade-2);
	}
}

.seventv-chat-list.seventv-chat-list[alternating-background="false"] {
	padding: 1em 0;
}
</style>
