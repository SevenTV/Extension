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
		<template v-if="ctx.actor.roles.has('MODERATOR') && properties.showModerationIcons && !hideModIcons">
			<ModIcons :msg="msg" />
		</template>

		<!-- Chat Author -->
		<UserTag
			v-if="msg.author && !hideAuthor"
			:user="msg.author"
			:badges="msg.badges"
			:msg-id="msg.sym"
			@open-native-card="openViewerCard($event, msg.author.username, msg.id)"
		/>

		<span v-if="!hideAuthor">
			{{ !msg.slashMe ? ": " : " " }}
		</span>

		<!-- Message Content -->
		<span class="seventv-chat-message-body">
			<template v-for="(token, index) of tokens" :key="index">
				<span v-if="typeof token === 'string'" class="text-token">{{ token }}</span>
				<span v-else-if="IsEmoteToken(token)">
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
					<component :is="getToken(token)" v-bind="{ token, msg }" />
				</template>
			</template>
		</span>

		<!-- Chat Rich Embed -->
		<RichEmbed v-if="msg.richEmbed.request_url" :rich-embed="msg.richEmbed" />

		<EmoteLinkEmbed v-if="msg.emoteLinkEmbed" :emote-id="msg.emoteLinkEmbed" />

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
import { IsEmoteToken, IsLinkToken, IsMentionToken } from "@/common/type-predicates/MessageTokens";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatModeration } from "@/composable/chat/useChatModeration";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useChatTools } from "@/composable/chat/useChatTools";
import { useCosmetics } from "@/composable/useCosmetics";
import { useConfig } from "@/composable/useSettings";
import type { TimestampFormatKey } from "@/site/twitch.tv/modules/chat/ChatModule.vue";
import ModIcons from "@/site/twitch.tv/modules/chat/components/mod/ModIcons.vue";
import Emote from "./Emote.vue";
import EmoteLinkEmbed from "./EmoteLinkEmbed.vue";
import MessageTokenLink from "./MessageTokenLink.vue";
import MessageTokenMention from "./MessageTokenMention.vue";
import RichEmbed from "./RichEmbed.vue";
import UserMessageButtons from "./UserMessageButtons.vue";
import UserTag from "./UserTag.vue";
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
		hideModIcons?: boolean;
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
const showModifiers = useConfig<boolean>("chat.show_emote_modifiers");
const timestampFormat = useConfig<TimestampFormatKey>("chat.timestamp_format");
// Get the locale to format the timestamp
const locale = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language ?? "en";

// Personal Emotes
const cosmetics = props.msg.author ? useCosmetics(props.msg.author.id) : { emotes: {} };

// Timestamp
const timestamp = ref("");

// Tokenize the message
type MessageTokenOrText = AnyToken | string;
const tokenizer = props.msg.getTokenizer();
const tokens = ref<MessageTokenOrText[]>([]);

function doTokenize() {
	if (!tokenizer) return;

	const newTokens = tokenizer.tokenize({
		chatterMap: props.chatters ?? {},
		emoteMap: props.emotes ?? {},
		localEmoteMap: { ...cosmetics.emotes, ...props.msg.nativeEmotes },
		showModifiers: showModifiers.value,
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

// eslint-disable-next-line vue/no-mutating-props
props.msg.refresh = doTokenize;

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

function getToken(token: AnyToken): AnyInstanceType {
	if (IsMentionToken(token)) {
		return MessageTokenMention;
	} else if (IsLinkToken(token)) {
		return MessageTokenLink;
	}
}

const useTimestampFormat = () => {
	switch (timestampFormat.value) {
		case "infer":
			return undefined;
		case "12":
			return "h12";
		case "24":
			return "h23";
	}
};

watchEffect(() => {
	if (!msg.value || !msgEl.value) return;

	if (msg.value.highlight) {
		msgEl.value.style.setProperty("--seventv-highlight-color", msg.value.highlight.color);
		msgEl.value.style.setProperty(
			"--seventv-highlight-dim-color",
			msg.value.highlight.color.concat(SetHexAlpha(highlightOpacity.value / 100)),
		);
	}

	if (properties.showTimestamps || msg.value.historical || props.forceTimestamp) {
		timestamp.value = intlFormat(
			{ locale },
			{
				localeMatcher: "lookup",
				hour: "2-digit",
				minute: "2-digit",
				second: displaySecondsInTimestamp.value ? "numeric" : undefined,
				...{ hourCycle: useTimestampFormat() },
			},
			props.msg.timestamp,
		);
	}
});
</script>

<style scoped lang="scss">
.seventv-user-message {
	display: block;

	&.has-highlight {
		padding: 1rem calc(var(--seventv-chat-padding, 1rem) - 0.25rem);
		margin: -0.5rem;
		margin-left: calc(var(--seventv-chat-padding, 1rem) * -1);
		margin-right: calc(-1 * var(--seventv-chat-padding, 1rem) + 0.25rem);
		border: 0.25rem solid transparent;
		border-top: none;
		border-bottom: none;

		&[data-highlight-style="0"] {
			border-color: var(--seventv-highlight-color);
			background-color: var(--seventv-highlight-dim-color);

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

.seventv-chat-message-moderated {
	&::before {
		content: "—";
	}

	display: inline-block;
	font-style: italic;
	vertical-align: center;
	color: var(--seventv-muted);
}

.deleted {
	&:not(:hover) > .seventv-chat-message-body {
		display: var(--seventv-chat-deleted-display);
		opacity: var(--seventv-chat-deleted-opacity);
		text-decoration: var(--seventv-chat-deleted-decoration);
	}

	&:hover {
		.seventv-chat-message-moderated {
			visibility: hidden;
		}
	}
}

.seventv-chat-message-timestamp {
	margin-right: 0.5rem;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.1rem;
	color: var(--seventv-muted);
}
</style>
