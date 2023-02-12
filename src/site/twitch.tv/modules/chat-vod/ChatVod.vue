<template>
	<template v-for="{ current, msg, timestamp } of messageRefs" :key="msg.id">
		<Teleport v-if="current.current" :to="current.current">
			<div class="seventv-chat-vod-message-wrapper">
				<span class="seventv-chat-vod-message-timestamp">{{ timestamp }}</span>
				<UserMessage :msg="msg" :emotes="emotes.active" />
			</div>
		</Teleport>
	</template>

	<!-- Re-use the ChatData component from the main chat module -->
	<ChatData v-if="ctx.loaded" />
</template>

<script setup lang="ts">
import { onUnmounted, reactive, ref, watch } from "vue";
import { REACT_TYPEOF_TOKEN } from "@/common/Constant";
import { log } from "@/common/Logger";
import { HookedInstance, REACT_ELEMENT_SYMBOL } from "@/common/ReactHooks";
import { defineFunctionHook, definePropertyHook, unsetPropertyHook } from "@/common/Reflection";
import { convertCheerEmote, convertTwitchEmote } from "@/common/Transform";
import { ChatMessage } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import ChatData from "@/site/twitch.tv/modules/chat/ChatData.vue";
import UserMessage from "@/site/twitch.tv/modules/chat/components/message/UserMessage.vue";
import type { TwTypeUser } from "@/assets/gql/tw.gql";
import { MessagePartType } from "../..";
import intervalToDuration from "date-fns/fp/intervalToDuration";

interface CommentData {
	badgeSets: Twitch.BadgeSets;
	canCurrentUserBan: boolean;
	canCurrentUserDelete: boolean;
	currentUser: TwTypeUser;
	messageContext: {
		author: {
			id: string;
			name: string;
			displayName: string;
		};
		comment: Twitch.VideoChatComment;
		lastUpdated: Date;
	};
}

interface TrackedMessageRef {
	current: { current: Element | null };
	msg: ChatMessage;
	timestamp: string;
}

const props = defineProps<{
	list: HookedInstance<ReactExtended.WritableComponent>;
	controller: HookedInstance<Twitch.VideoChatComponent>;
}>();

// Set up context
// No ID initialization to avoid conflict with live channel
const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);
const properties = useChatProperties(ctx);

const messageRefs = ref<TrackedMessageRef[]>([]);

// Capture current channel
definePropertyHook(props.controller.component, "props", {
	value(v) {
		const { owner } = v.data.video ?? {};

		const globalBadges = v.data.badges;
		let channelBadges = null;

		if (owner) {
			ctx.setCurrentChannel({
				id: owner.id,
				username: owner.login,
				displayName: owner.login,
			});

			channelBadges = owner.broadcastBadges;
		}

		if (v.data.badges) {
			if (!properties.twitchBadgeSets?.globalsBySet && !properties.twitchBadgeSets?.channelsBySet) {
				properties.twitchBadgeSets = {
					globalsBySet: new Map(),
					channelsBySet: new Map(),
					count: 0,
				};

				for (const badge of [...globalBadges, ...(channelBadges ?? [])]) {
					let m = properties.twitchBadgeSets.globalsBySet.get(badge.setID);
					if (!m) {
						m = new Map();

						properties.twitchBadgeSets.globalsBySet.set(badge.setID, m);
						properties.twitchBadgeSets.count++;
					}

					m.set(badge.version, badge);
				}
			}
		}

		if (v.canCurrentUserBan || v.canCurrentUserDelete) {
			properties.showModerationIcons = true;
			properties.isModerator = true;
		}
	},
});

// Capture message list, patch comments
defineFunctionHook(props.list.component, "render", function (this, f) {
	const cur = f?.apply(this);
	const el = cur as ReactExtended.ReactRuntimeElement;

	let child: ReactExtended.ReactRuntimeElement | ReactExtended.ReactRuntimeElement[] | undefined = el.props.children;
	let depth = 0;
	for (;;) {
		if (depth++ > 25) break; // fail-safe to avoid infinite loop

		// Descend onto the tree
		// try to find the "ul" element (message list)
		if (Array.isArray(child)) {
			child = child[0];
		} else if (child) {
			child = child.props.children;
		}

		// Patch the message list once it's found
		if (child && !Array.isArray(child) && child.type === "ul") {
			child.props.children = patchComments(child.props.children);
			break;
		}
	}

	return cur;
});

// Trigger update when message list updates on our end
watch(messageRefs.value, () => {
	if (!props.list.component || typeof props.list.component.componentDidUpdate !== "function") return;

	props.list.component.componentDidUpdate(props.list.component.props, props.list.component.state);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isCommentData(data: any): data is CommentData {
	return (
		data &&
		data.badgeSets &&
		data.canCurrentUserBan !== undefined &&
		data.canCurrentUserDelete !== undefined &&
		data.currentUser &&
		data.messageContext &&
		data.messageContext.author &&
		data.messageContext.comment &&
		data.messageContext.lastUpdated
	);
}

function patchComments(comments: ReactExtended.ReactRuntimeElement[]): ReactExtended.ReactRuntimeElement[] {
	const newList = [] as ReactExtended.ReactRuntimeElement[];

	messageRefs.value.length = comments.length;
	for (let i = 0; i < comments.length; i++) {
		const c = comments[i];
		if (!c) continue;

		const props = c.props;
		if (!props) continue;

		const children = props.children;
		if (!children) continue;

		const data = children.props?.children?.props;
		if (!isCommentData(data)) continue;

		const msgRef = createMessageComponentRef(data);
		c.props.children = msgRef.element;

		newList[i] = c;
		messageRefs.value[i] = {
			current: reactive(msgRef.element.ref),
			msg: msgRef.msg,
			timestamp: msgRef.timestamp,
		};
	}

	return newList;
}

function createMessageComponentRef(data: CommentData) {
	const track = ref({ current: null as HTMLElement | null });

	const msgData = data.messageContext.comment;
	const msg = new ChatMessage(data.messageContext.comment.id);

	if (data.messageContext.author) {
		msg.setAuthor({
			id: data.messageContext.author.id,
			username: data.messageContext.author.name ?? "",
			displayName: data.messageContext.author.displayName ?? "",
			color: msgData.message.userColor,
		});

		msg.badges = msgData.userBadges;
	}

	for (const tok of msgData.message.tokens) {
		switch (tok.type) {
			case MessagePartType.EMOTE: {
				const e = tok.content as Twitch.ChatMessage.EmotePart["content"];
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

				msg.body += e.alt;
				break;
			}
			case MessagePartType.MENTION:
				msg.body += `@${tok.content.recipient}`;
				break;
			case MessagePartType.TEXT:
			case MessagePartType.CURRENTUSERHIGHLIGHT:
				msg.body += tok.content;
				break;
			case MessagePartType.LINK:
			case MessagePartType.CLIPLINK:
			case MessagePartType.VIDEOLINK:
				msg.body += tok.content.url;
				break;
		}
	}

	const duration = intervalToDuration({ start: 0, end: msgData.contentOffset * 1000 });
	const durD = duration.days ? duration.days?.toString().padStart(2, "0") : "";
	const durH = duration.hours ? duration.hours?.toString().padStart(2, "0") : durD ? "00" : "";
	const durM = duration.minutes?.toString().padStart(2, "0") ?? "00";
	const durS = duration.seconds?.toString().padStart(2, "0") ?? "00";

	return {
		element: {
			[REACT_TYPEOF_TOKEN]: REACT_ELEMENT_SYMBOL,
			key: null,
			ref: track.value,
			type: "div",
			props: {
				className: "seventv-chat-vod-message-patched",
			},
		},
		msg,
		timestamp: [durD, durH, durM, durS].filter((v) => v).join(":"),
	};
}

onUnmounted(() => {
	unsetPropertyHook(props.controller.component, "props");
	unsetPropertyHook(props.list.component, "render");

	log.debug("<Chat/Vod> Unmounted");
});
</script>

<style lang="scss" scoped>
.seventv-chat-vod-message-wrapper {
	display: grid;
	grid-template-columns: auto 1fr;
	column-gap: 0.5rem;
	margin: 0.25rem 1rem !important;
}

.seventv-chat-vod-message-timestamp {
	color: var(--seventv-muted);
	font-size: 1rem;
}
</style>
