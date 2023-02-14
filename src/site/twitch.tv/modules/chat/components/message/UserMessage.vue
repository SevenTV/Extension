<template>
	<span
		ref="msgEl"
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
			<span class="seventv-chat-message-timestamp">
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
			<ModIcons :msg="msg" />
		</template>

		<!-- Chat Author -->
		<UserTag
			v-if="msg.author && !hideAuthor"
			:user="msg.author"
			:color="color"
			:badges="msg.badges"
			:msg-id="msg.sym"
			@name-click="(ev) => openViewerCard(ev, msg)"
			@badge-click="(ev, badge) => openViewerCard(ev, msg)"
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
						:format="properties.imageFormat"
						:overlaid="token.content.overlaid"
						:clickable="true"
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
import { onMounted, ref, toRef, watch, watchEffect } from "vue";
import { useTimeoutFn } from "@vueuse/shared";
import { normalizeUsername } from "@/common/Color";
import type { AnyToken, ChatMessage } from "@/common/chat/ChatMessage";
import { IsEmotePart, IsLinkPart, IsMentionPart } from "@/common/type-predicates/MessageParts";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useChatTools } from "@/composable/chat/useChatTools";
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
		emotes?: Record<string, SevenTV.ActiveEmote>;
		isModerator?: boolean;
		hideAuthor?: boolean;
		hideModeration?: boolean;
		hideDeletionState?: boolean;
		forceTimestamp?: boolean;
	}>(),
	{ as: "Chat" },
);

const msg = toRef(props, "msg");
const msgEl = ref<HTMLSpanElement | null>();

const ctx = useChannelContext();
const properties = useChatProperties(ctx);
const { openViewerCard } = useChatTools(ctx);

// TODO: css variables
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
const tokens = ref([] as MessageTokenOrText[]);

function doTokenize() {
	if (!tokenizer) return;

	const newTokens = tokenizer.tokenize({
		emoteMap: props.emotes ?? {},
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

	tokens.value = result;
}

watch(
	() => [cosmetics.emotes, props.msg.nativeEmotes],
	() => doTokenize(),
	{ immediate: true },
);

// For historical messages
// Re-render emotes once they load in
if (props.msg.historical) {
	useTimeoutFn(
		watchEffect(() => {
			doTokenize();
		}),
		1e4,
	);
}

function getPart(part: AnyToken) {
	if (IsEmotePart(part)) {
		return Emote;
	} else if (IsMentionPart(part)) {
		return Mention;
	} else if (IsLinkPart(part)) {
		return Link;
	}
}

onMounted(() => {
	if (!msg.value || !msgEl.value) return;

	if (msg.value.highlight) {
		msgEl.value.style.setProperty("--seventv-highlight-color", msg.value.highlight.color);
		msgEl.value.style.setProperty("--seventv-highlight-dim-color", msg.value.highlight.dimColor);
	}
});
</script>

<style scoped lang="scss">
.seventv-user-message {
	display: block;

	&.has-highlight {
		border: 0.25em solid;
		border-top: none;
		border-bottom: none;
		border-color: var(--seventv-highlight-color);
		background-color: var(--seventv-highlight-dim-color);
		padding: 1rem 0.25rem;
		margin: 0 -0.5em;

		.seventv-chat-message-highlight-label {
			&::after {
				height: 0;
				content: attr(data-highlight-label);
				display: grid;
				width: 100%;
				justify-content: end;
				color: var(--seventv-highlight-color);
				transform: translateY(-1.5em);

				font-weight: 600;
				text-transform: uppercase;
				font-size: 0.88rem;
			}
		}
	}

	.emote-token {
		display: inline-grid;
		vertical-align: middle;
		margin: var(--seventv-emote-margin);
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

.seventv-chat-message-timestamp {
	margin-right: 0.5rem;
	color: var(--seventv-muted);
}
</style>
