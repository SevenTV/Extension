<template>
	<a v-if="isBlocked && !unhidden" class="seventv-blocked-message" @click="unhidden = true">
		Message by blocked user
	</a>
	<span
		v-else
		class="seventv-user-message"
		:class="{
			deleted: msg.banned || msg.deleted,
			'has-mention': as == 'Chat' && hasMention,
		}"
		:state="msg.sendState"
		:style="{
			'font-style': msg.messageType === 1 && meStyle & 1 ? 'italic' : '',
			color: msg.messageType === 1 && meStyle & 2 ? adjustedColor : '',
		}"
	>
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
import { computed, ref } from "vue";
import { normalizeUsername } from "@/common/Color";
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
	}>(),
	{ as: "Chat" },
);

const emotes = useChatEmotes();
const properties = useChatProperties();

const emoteMargin = useConfig<number>("chat.emote_margin");
const emoteMarginValue = computed(() => `${emoteMargin.value}rem`);

const meStyle = useConfig<number>("chat.slash_me_style");

const unhidden = ref(false);

const { nameClick, emoteClick, badgeClick } = useCardOpeners(props.msg);

// Get the locale to format the timestamp
const locale = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language ?? "en";

// Personal Emotes
const cosmetics = useCosmetics(props.msg.user.userID);

// Tokenize the message
const tokenizer = new Tokenizer(props.msg.messageParts);
const tokens = computed(() => {
	return tokenizer.getParts(emotes.active, cosmetics.emotes);
});

const adjustedColor = computed(() => {
	return properties.useHighContrastColors
		? normalizeUsername(props.msg.user.color, properties.isDarkTheme as 0 | 1)
		: props.msg.user.color;
});

const hasMention = ref(false);
const isBlocked = computed(() => properties.blockedUsers.has(props.msg.user.userID));

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
			if (part.content.currentUserMentionRelation == 1) hasMention.value = true;
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
	&.has-mention {
		margin: -0.5rem -1rem;
		padding: 0.5rem 1rem;
		box-shadow: inset 0 0 0.1rem 0.1rem red;
		background-color: #ff000040;
		border-radius: 0.5rem;
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
