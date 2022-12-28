<template>
	<span v-if="user && user.userDisplayName" class="seventv-chat-user" :style="{ color: color }">
		<!--Badge List -->
		<span v-if="badges.length" class="seventv-chat-user-badge-list">
			<ChatBadge v-for="(badge, index) of badges" :key="index" :badge="badge" />
		</span>

		<!-- Message Author -->
		<span class="seventv-chat-user-username">
			<span>{{ user.userDisplayName }}</span>
			<span v-if="user.isIntl"> ({{ user.userLogin }})</span>
		</span>
	</span>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ChatBadge from "./ChatBadge.vue";
import { normalizeUsername } from "@/site/twitch.tv/modules/chat/ChatBackend";
import { useChatAPI } from "@/site/twitch.tv/ChatAPI";
const props = defineProps<{
	user: Twitch.ChatUser;
	badges?: Record<string, string>;
}>();

const { twitchBadgeSets } = useChatAPI();
const badges = ref([] as Twitch.ChatBadge[]);

const color = ref(props.user.color);

// Get these from twitch settings
const readableColors = true;
color.value = normalizeUsername(color.value, readableColors);

if (props.badges && twitchBadgeSets.value) {
	for (const [key, value] of Object.entries(props.badges)) {
		const setID = key;
		const badgeID = value;

		for (const setGroup of [twitchBadgeSets.value.channelsBySet, twitchBadgeSets.value.globalsBySet]) {
			if (!setGroup) continue;

			const set = setGroup.get(setID);
			if (!set) continue;

			const badge = set.get(badgeID);
			if (!badge) continue;

			badges.value.push(badge);
			break;
		}
	}
}
</script>

<style scoped lang="scss">
.seventv-chat-user {
	display: inline;
	cursor: pointer;
	word-break: break-all;
}

.seventv-chat-user-badge-list {
	margin-right: 0.25em;

	.seventv-chat-badge ~ .seventv-chat-badge {
		margin-left: 0.25em;
	}
}

.seventv-chat-user-username {
	font-weight: 700;

	&:hover {
		text-decoration: underline;
	}
}
</style>
