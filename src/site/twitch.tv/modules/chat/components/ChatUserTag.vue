<template>
	<span v-if="user && user.userDisplayName" class="seventv-chat-user" :style="{ color: user.color }">
		<!--Badge List -->
		<span class="seventv-chat-user-badge-list">
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
import { useTwitchStore } from "@/site/twitch.tv/TwitchStore";
import { ref } from "vue";
import ChatBadge from "./ChatBadge.vue";
const props = defineProps<{
	user: Twitch.ChatUser;
	badges?: Record<string, string>;
}>();

const { twitchBadgeSets } = useTwitchStore();
const badges = ref([] as Twitch.ChatBadge[]);

if (props.badges && twitchBadgeSets) {
	for (const [key, value] of Object.entries(props.badges)) {
		const setID = key;
		const badgeID = value;

		for (const setGroup of [twitchBadgeSets.channelsBySet, twitchBadgeSets.globalsBySet]) {
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
	display: inline-block !important;
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
