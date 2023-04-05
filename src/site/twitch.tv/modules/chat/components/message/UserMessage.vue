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
			color: msg.slashMe && meStyle & 2 ? msg.author?.color : '',
		}"
		:data-highlight-style="highlightStyle"
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
				{{ timestamp }}
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
			:badges="msg.badges"
			:msg-id="msg.sym"
			@name-click="(ev) => openViewerCard(ev, msg.author!.username, msg.id)"
			@badge-click="(ev) => openViewerCard(ev, msg.author!.username, msg.id)"
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
						:scale="Number(emoteScale)"
					/>
					<span v-if="token.content" :style="{ color: token.content.cheerColor }">
						{{ token.content.cheerAmount }}
					</span>
				</span>
				<template v-else>
					<Component :is="getPart(token)" :token="token" :msg="msg" />
				</template>
			</template>
		</span>

		<!-- Ban State -->
		<template v-if="!hideModeration && (msg.moderation.banned || msg.moderation.deleted)">
			<span v-if="msg.moderation.banned" class="seventv-chat-message-moderated">
				{{ msg.moderation.banDuration ? `Timed out (${msg.moderation.banDuration}s)` : "Permanently Banned" }}
			</span>
			<span v-else class="seventv-chat-message-moderated">Deleted</span>
		</template>

		<!-- Buttons (Reply, Pin) -->
		<UserMessageButtons :msg="msg" @pin="doPinMessage()" />
	</span>
</template>

<script setup lang="ts">
import { ref, toRef, watch, watchEffect } from "vue";
import { useTimeoutFn } from "@vueuse/shared";
import { SetHexAlpha } from "@/common/Color";
import { log } from "@/common/Logger";
import type { AnyToken, ChatMessage, ChatUser } from "@/common/chat/ChatMessage";
import { IsEmotePart, IsLinkPart, IsMentionPart } from "@/common/type-predicates/MessageParts";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatModeration } from "@/composable/chat/useChatModeration";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useChatTools } from "@/composable/chat/useChatTools";
import { useCosmetics } from "@/composable/useCosmetics";
import { useConfig } from "@/composable/useSettings";
import Emote from "@/site/twitch.tv/modules/chat/components/message/Emote.vue";
import UserTag from "@/site/twitch.tv/modules/chat/components/message/UserTag.vue";
import UserMessageButtons from "./UserMessageButtons.vue";
import Link from "./parts/Link.vue";
import Mention from "./parts/Mention.vue";
import ModIcons from "../mod/ModIcons.vue";
import intlFormat from "date-fns/fp/intlFormat";

const props = withDefaults(
	defineProps<{
		msg: ChatMessage;
		as?: "Chat" | "Reply";
		highlight?: {
			label: string;
			color: string;
		};
		emotes?: Record<string, SevenTV.ActiveEmote>;
		chatters?: Record<string, ChatUser>;
		isModerator?: boolean;
		hideAuthor?: boolean;
		hideModeration?: boolean;
		hideDeletionState?: boolean;
		showButtons?: boolean;
		forceTimestamp?: boolean;
	}>(),
	{ as: "Chat" },
);

const msg = toRef(props, "msg");
const msgEl = ref<HTMLSpanElement | null>();

const ctx = useChannelContext();
const properties = useChatProperties(ctx);
const { openViewerCard } = useChatTools(ctx);
const { pinChatMessage } = useChatModeration(ctx, msg.value.author?.username ?? "");

const emoteScale = useConfig<number>("chat.emote_scale");

// TODO: css variables
const meStyle = useConfig<number>("chat.slash_me_style");
const highlightStyle = useConfig<number>("highlights.display_style");
const highlightOpacity = useConfig<number>("highlights.opacity");
const displaySecondsInTimestamp = useConfig<boolean>("chat.timestamp_with_seconds");

// Get the locale to format the timestamp
const locale = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language ?? "en";

// Personal Emotes
const cosmetics = props.msg.author ? useCosmetics(props.msg.author.id) : { emotes: {} };

// Timestamp
const timestamp = ref("");

// Tokenize the message
type MessageTokenOrText = AnyToken | string;
const tokenizer = props.msg.getTokenizer();
const tokens = ref([] as MessageTokenOrText[]);

function doTokenize() {
	if (!tokenizer) return;

	const newTokens = tokenizer.tokenize({
		chatterMap: props.chatters ?? {},
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

function doPinMessage(): void {
	pinChatMessage(msg.value.id, 1200)?.catch((err) => log.error("failed to pin chat message", err));
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

watchEffect(() => {
	if (!msg.value || !msgEl.value) return;

	if (msg.value.highlight) {
		msgEl.value.style.setProperty("--seventv-highlight-color", msg.value.highlight.color);
		msgEl.value.style.setProperty(
			"--seventv-highlight-dim-color",
			msg.value.highlight.color.concat(SetHexAlpha(highlightOpacity.value / 100)),
		);
	}

	timestamp.value = intlFormat(
		{ locale },
		{
			localeMatcher: "lookup",
			hour: "numeric",
			minute: "numeric",
			second: displaySecondsInTimestamp.value ? "numeric" : undefined,
		},
		props.msg.timestamp,
	).replace(/ (A|P)M/, "");
});
</script>

<style scoped lang="scss">
.seventv-user-message {
	display: block;

	&.has-highlight {
		margin-top: -0.5rem;
		margin-bottom: -0.5rem;
		margin-left: -1rem;
		margin-right: -0.75rem;

		&[data-highlight-style="0"] {
			border: 0.25rem solid;
			border-top: none;
			border-bottom: none;
			border-color: var(--seventv-highlight-color);
			background-color: var(--seventv-highlight-dim-color);
			padding: 1rem 0.75rem;

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

		&[data-highlight-style="1"] {
			padding: 0.5rem 1.5rem;
			background-color: var(--seventv-highlight-dim-color);
		}
	}

	.emote-token {
		display: inline-grid;
		vertical-align: middle;
		margin: var(--seventv-emote-margin);
		margin-left: 0 !important;
		margin-right: 0 !important;
	}
}
.deleted {
	&:not(:hover) > .seventv-chat-message-body {
		display: var(--seventv-chat-deleted-display);
		opacity: var(--seventv-chat-deleted-opacity);
		text-decoration: var(--seventv-chat-deleted-decoration);
	}

	&:hover {
		.seventv-chat-message-moderated {
			display: none !important;
		}
	}
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
