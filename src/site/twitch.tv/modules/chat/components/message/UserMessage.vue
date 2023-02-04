<template>
	<span
		class="seventv-user-message"
		:msg-id="msg.id"
		:class="{
			deleted: !hideDeletionState && (msg.moderation.banned || msg.moderation.deleted),
			'has-mention': as == 'Chat' && msg.mentions.has('#actor'),
			'has-highlight': as == 'Chat' && msg.highlight,
		}"
		:state="msg.deliveryState"
		:style="{
			'font-style': msg.slashMe && meStyle & 1 ? 'italic' : '',
			color: msg.slashMe && meStyle & 2 ? color : '',
		}"
	>
		<!-- Highlight Label -->
		<div
			v-if="msg.highlight"
			class="seventv-chat-message-highlight-label"
			:data-highlight-label="msg.highlight.label"
		/>

		<!-- Timestamp -->
		<template v-if="properties.showTimestamps || msg.historical || forceTimestamp">
			<span class="chat-line__timestamp">
				{{
					new Date(props.msg.timestamp).toLocaleTimeString(locale, {
						hour: "numeric",
						minute: "numeric",
						hour12: false,
					})
				}}
			</span>
		</template>

		<!-- Mod Icons -->
		<template v-if="properties.isModerator && properties.showModerationIcons">
			<ModIcons
				:msg="msg"
				@ban="banUserFromChat(null)"
				@timeout="banUserFromChat('10m')"
				@delete="deleteChatMessage(msg.id)"
			/>
		</template>

		<!-- Chat Author -->
		<UserTag
			v-if="msg.author && !hideAuthor"
			:user="msg.author"
			:color="color"
			:badges="msg.badges"
			@name-click="nameClick"
			@badge-click="badgeClick"
		/>

		<span v-if="!hideAuthor">
			{{ !msg.slashMe ? ": " : " " }}
		</span>

		<!-- Message Content -->
		<span class="seventv-chat-message-body">
			<template v-for="(token, index) of tokens" :key="index">
				<span v-if="typeof token === 'string'" class="text-token">{{ token }}</span>
				<span v-else-if="IsEmotePart(token)">
					<Emote
						class="emote-token"
						:emote="token.content.emote"
						:overlaid="token.content.overlaid"
						@emote-click="emoteClick"
					/>
					<span v-if="token.content" :style="{ color: token.content.cheerColor }">
						{{ token.content.cheerAmount }}
					</span>
				</span>
				<template v-else>
					<Component :is="getPart(token)" :token="token" />
				</template>
			</template>
		</span>

		<!-- Ban State -->
		<template v-if="!hideModeration && msg.moderation.banned">
			<span class="seventv-chat-message-moderated seventv-chat-message-banned">
				{{ msg.moderation.banDuration ? `Timed out (${msg.moderation.banDuration}s)` : "Permanently Banned" }}
			</span>
		</template>
	</span>
</template>

<script setup lang="ts">
import { computed, toRef } from "vue";
import { normalizeUsername } from "@/common/Color";
import { AnyToken, ChatMessage } from "@/common/chat/ChatMessage";
import { IsEmotePart, IsLinkPart, IsMentionPart } from "@/common/type-predicates/MessageParts";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useChatModeration } from "@/composable/chat/useChatModeration";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useCardOpeners } from "@/composable/useCardOpeners";
import { useCosmetics } from "@/composable/useCosmetics";
import { useConfig } from "@/composable/useSettings";
import Emote from "@/site/twitch.tv/modules/chat/components/message/Emote.vue";
import UserTag from "@/site/twitch.tv/modules/chat/components/message/UserTag.vue";
import Link from "./parts/Link.vue";
import Mention from "./parts/Mention.vue";
import ModIcons from "../mod/ModIcons.vue";

const props = withDefaults(
	defineProps<{
		msg: ChatMessage;
		as?: "Chat" | "Reply";
		highlight?: {
			label: string;
			color: string;
		};
		hideAuthor?: boolean;
		hideModeration?: boolean;
		hideDeletionState?: boolean;
		forceTimestamp?: boolean;
	}>(),
	{ as: "Chat" },
);

const msg = toRef(props, "msg");

const emotes = useChatEmotes();
const properties = useChatProperties();
const { nameClick, emoteClick, badgeClick } = useCardOpeners(props.msg);

const emoteMargin = useConfig<number>("chat.emote_margin");
const emoteMarginValue = computed(() => `${emoteMargin.value}rem`);
const meStyle = useConfig<number>("chat.slash_me_style");

// Get the locale to format the timestamp
const locale = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language ?? "en";

const color =
	props.msg.author && props.msg.author.color
		? properties.useHighContrastColors
			? normalizeUsername(props.msg.author.color, properties.isDarkTheme as 0 | 1)
			: props.msg.author.color
		: "inherit";

// Personal Emotes
const cosmetics = props.msg.author ? useCosmetics(props.msg.author.id) : { emotes: {} };

// Tokenize the message
type MessageTokenOrText = AnyToken | string;
const tokenizer = props.msg.getTokenizer();
const tokens = computed<MessageTokenOrText[]>(() => {
	if (!tokenizer) return [];

	const newTokens = tokenizer.tokenize({
		emoteMap: emotes.active,
		localEmoteMap: { ...cosmetics.emotes, ...props.msg.nativeEmotes },
	});

	const result: MessageTokenOrText[] = [];
	const text = props.msg.body;

	let lastOffset = 0;
	for (const tok of newTokens) {
		const start = tok.range[0];
		const end = tok.range[1];

		const before = text.substring(lastOffset, start);
		if (before) {
			result.push(before);
		}

		result.push(tok);

		lastOffset = end + 1;
	}

	const after = text.substring(lastOffset);
	if (after) {
		result.push(after);
	}

	return result;
});

function getPart(part: AnyToken) {
	if (IsEmotePart(part)) {
		return Emote;
	} else if (IsMentionPart(part)) {
		return Mention;
	} else if (IsLinkPart(part)) {
		return Link;
	}
}

// Moderation
const { banUserFromChat, deleteChatMessage } =
	props.msg.channelID && props.msg.author
		? useChatModeration(props.msg.channelID!, props.msg.author?.username)
		: { banUserFromChat: () => void 0, deleteChatMessage: () => void 0 };
</script>

<style scoped lang="scss">
.seventv-user-message {
	display: block;

	&.has-highlight {
		border: 0.25em solid;
		border-color: v-bind("msg.highlight?.color");
		border-top: none;
		border-bottom: none;
		background-color: v-bind("msg.highlight?.dimColor");
		padding: 1rem 0.25rem;
		margin: 0 -0.5em;

		.seventv-chat-message-highlight-label {
			&::after {
				height: 0;
				content: attr(data-highlight-label);
				display: grid;
				width: 100%;
				justify-content: end;
				color: v-bind("msg.highlight?.color");
				transform: translateY(-1.5em);

				font-weight: 600;
				text-transform: uppercase;
				font-size: 0.88rem;
			}
		}
	}

	&[state="IN_FLIGHT"] {
		opacity: 0.5;
	}

	&[state="FAILED"] {
		opacity: 0.5;
		color: var(--seventv-warning);
	}

	.emote-token {
		display: inline-grid;
		vertical-align: middle;
		margin: v-bind("emoteMarginValue");
		margin-left: 0 !important;
		margin-right: 0 !important;
	}

	.mention-part {
		padding: 0.2rem;
		font-weight: bold;
	}
}
.deleted:not(:hover) > .seventv-chat-message-body {
	opacity: 0.5;
	text-decoration: line-through;
}

.seventv-chat-message-moderated {
	&::before {
		content: "—";
	}

	display: inline-block;
	font-style: italic;
	vertical-align: center;
	color: var(--seventv-muted);
}
</style>
