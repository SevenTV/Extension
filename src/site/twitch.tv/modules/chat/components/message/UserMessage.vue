<template>
	<span
		class="seventv-user-message"
		:msg-id="msg.id"
		:class="{
			deleted: msg.banned || msg.deleted,
			'has-mention': as == 'Chat' && hasMention,
			'has-highlight': as == 'Chat' && msg.highlight,
		}"
		:state="msg.sendState"
		:style="{
			'font-style': msg.messageType === 1 && meStyle & 1 ? 'italic' : '',
			color: msg.messageType === 1 && meStyle & 2 ? color : '',
		}"
	>
		<!-- Highlight Label -->
		<div
			v-if="msg.highlight"
			class="seventv-chat-message-highlight-label"
			:data-highlight-label="msg.highlight.label"
		/>

		<!-- Timestamp -->
		<template v-if="properties.showTimestamps || msg.isHistorical">
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
			v-if="msg.user"
			:user="msg.user"
			:badges="msg.badges"
			:color="color"
			@name-click="nameClick"
			@badge-click="badgeClick"
		/>

		<span>
			{{ msg.messageType === 0 ? ": " : " " }}
		</span>

		<!-- Message Content -->
		<span class="seventv-chat-message-body">
			<template v-for="part of tokens" :key="part.key">
				<span v-if="part.type === MessagePartType.SEVENTVEMOTE">
					<span class="emote-part">
						<Emote :emote="part.content" @emote-click="emoteClick" />
					</span>
					<span v-if="part.content.cheerAmount" :style="{ color: part.content.cheerColor }">
						{{ part.content.cheerAmount }}
					</span>
				</span>
				<template v-else>
					<Component :is="getPart(part)" :part="part" />
				</template>
			</template>
		</span>
	</span>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { SetHexAlpha, normalizeUsername } from "@/common/Color";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useChatModeration } from "@/composable/chat/useChatModeration";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useCardOpeners } from "@/composable/useCardOpeners";
import { useCosmetics } from "@/composable/useCosmetics";
import { useConfig } from "@/composable/useSettings";
import { MessagePartType } from "@/site/twitch.tv";
import Emote from "@/site/twitch.tv/modules/chat/components/message/Emote.vue";
import UserTag from "@/site/twitch.tv/modules/chat/components/message/UserTag.vue";
import { Tokenizer } from "./Tokenizer";
import FlaggedSegment from "./parts/FlaggedSegment.vue";
import Link from "./parts/Link.vue";
import Mention from "./parts/Mention.vue";
import Text from "./parts/Text.vue";
import ModIcons from "../mod/ModIcons.vue";

const props = withDefaults(
	defineProps<{
		msg: Twitch.ChatMessage;
		as?: "Chat" | "Reply";
		highlight?: {
			label: string;
			color: string;
		};
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

// Personal Emotes
const color = properties.useHighContrastColors
	? normalizeUsername(props.msg.user.color, properties.isDarkTheme as 0 | 1)
	: props.msg.user.color;
const cosmetics = useCosmetics(props.msg.user.userID);

// Tokenize the message
const tokenizer = new Tokenizer(props.msg.messageParts);
const tokens = computed(() => tokenizer.getParts(emotes.active, cosmetics.emotes));

const highlightColorDim = computed(() => msg.value.highlight?.color.concat(SetHexAlpha(0.1)));
const hasMention = ref(false);

if (props.highlight) {
	msg.value.highlight = props.highlight ?? {};
} else if (props.msg.isFirstMsg) {
	msg.value.highlight = {
		label: "First Message",
		color: "#c832c8",
	};
} else if (props.msg.isReturningChatter) {
	msg.value.highlight = {
		label: "Returning Chatter",
		color: "#3296e6",
	};
}

function getPart(part: Twitch.ChatMessage.Part) {
	switch (part.type) {
		case MessagePartType.TEXT:
		case MessagePartType.MODERATEDTEXT:
			return Text;
		case MessagePartType.CURRENTUSERHIGHLIGHT:
			hasMention.value = true;
			return Text;
		case MessagePartType.FLAGGEDSEGMENT:
			return FlaggedSegment;
		case MessagePartType.MENTION:
			if (part.content.currentUserMentionRelation == 1) {
				hasMention.value = true;
				if (!msg.value.highlight) {
					msg.value.highlight = {
						label: "Mentions You",
						color: "#e11919",
					};
				}
			}
			return Mention;
		case MessagePartType.LINK:
		case MessagePartType.CLIPLINK:
		case MessagePartType.VIDEOLINK:
		case MessagePartType.SEVENTVLINK:
			return Link;
		default:
			return new Error("Unknown part");
	}
}

// Moderation
const { banUserFromChat, deleteChatMessage } = useChatModeration(props.msg.channelID!, props.msg.user.userLogin);
</script>

<style scoped lang="scss">
.seventv-user-message {
	display: block;

	&.has-highlight {
		border: 0.25em solid;
		border-color: v-bind("msg.highlight?.color");
		border-top: none;
		border-bottom: none;
		background-color: v-bind("highlightColorDim");
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

	&[state="sending"] {
		opacity: 0.5;
	}

	&[state="failed"] {
		opacity: 0.5;
		color: var(--seventv-warning);
	}

	.emote-part {
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
.deleted:not(:hover) {
	opacity: 0.5;
	text-decoration: line-through;
}
</style>
