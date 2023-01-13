<template>
	<span
		class="seventv-chat-message"
		:class="{
			deleted: msg.banned || msg.deleted,
		}"
		:style="{
			'font-style': msg.messageType === 1 && mentionStyle & 1 ? 'italic' : '',
			color: msg.messageType === 1 && mentionStyle & 2 ? adjustedColor : '',
		}"
	>
		<template v-if="showTimestamps">
			<span class="chat-line__timestamp">
				{{
					new Date(props.msg.timestamp).toLocaleTimeString(locale, {
						hour: "numeric",
						minute: "numeric",
					})
				}}
			</span>
		</template>
		<!-- Chat Author -->
		<UserTag
			v-if="msg.user"
			:user="msg.user"
			:badges="msg.badges"
			:color="adjustedColor"
			@name-click="nameClick"
			@badge-click="badgeClick"
		/>

		<span>
			{{ msg.messageType === 0 ? ": " : " " }}
		</span>

		<!-- Message Content -->
		<span class="seventv-chat-message-body">
			<template v-for="(part, index) of tokens" :key="index">
				<span v-if="part.type === MessagePartType.SEVENTVEMOTE">
					<span
						class="emote-part"
						:style="{
							margin: `${emoteMargin}rem`,
						}"
					>
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
import { computed } from "vue";
import { normalizeUsername } from "@/common/Color";
import { useCardOpeners } from "@/composable/useCardOpeners";
import { useCosmetics } from "@/composable/useCosmetics";
import { useConfig } from "@/composable/useSettings";
import { MessagePartType } from "@/site/twitch.tv";
import { useChatAPI } from "@/site/twitch.tv/ChatAPI";
import Emote from "@/site/twitch.tv/modules/chat/components/message/Emote.vue";
import UserTag from "@/site/twitch.tv/modules/chat/components/message/UserTag.vue";
import { Tokenizer } from "./Tokenizer";
import FlaggedSegment from "./parts/FlaggedSegment.vue";
import Link from "./parts/Link.vue";
import Mention from "./parts/Mention.vue";
import Text from "./parts/Text.vue";

const props = defineProps<{
	msg: Twitch.ChatMessage;
}>();

const { emoteMap, showTimestamps, useHighContrastColors, isDarkTheme } = useChatAPI();

// Get this from twitch settings instead?
const emoteMargin = useConfig<number>("chat.emote_margin");
const mentionStyle = useConfig<number>("chat.slash_me_style");

const { nameClick, emoteClick, badgeClick } = useCardOpeners(props.msg);

// Get the locale to format the timestamp
const locale = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language ?? "en";

// Personal Emotes
const { emotes: userEmoteMap } = useCosmetics(props.msg.user.userID);

// Tokenize the message
const tokenizer = new Tokenizer(props.msg.messageParts);
const tokens = computed(() => {
	return tokenizer.getParts(emoteMap.value, userEmoteMap.value);
});

// TODO: Get the get the readableChatColors from somewhere and return uncomputed name
const adjustedColor = computed(() => {
	return useHighContrastColors.value
		? normalizeUsername(props.msg.user.color, isDarkTheme.value as 0 | 1)
		: props.msg.user.color;
});

function getPart(part: Twitch.ChatMessage.Part) {
	switch (part.type) {
		case MessagePartType.TEXT:
		case MessagePartType.MODERATEDTEXT:
		case MessagePartType.CURRENTUSERHIGHLIGHT:
			return Text;
		case MessagePartType.FLAGGEDSEGMENT:
			return FlaggedSegment;
		case MessagePartType.MENTION:
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
</script>

<style scoped lang="scss">
.seventv-chat-message {
	vertical-align: baseline;
	.emote-part {
		display: inline-grid;
		vertical-align: middle;
		margin-left: 0 !important;
		margin-right: 0 !important;
	}

	.mention-part {
		padding: 0.2rem;
		font-weight: bold;
	}
}

.slash-me-italic {
	font-style: italic;
}
.deleted:not(:hover) {
	opacity: 0.5;
	text-decoration: line-through;
}
</style>
