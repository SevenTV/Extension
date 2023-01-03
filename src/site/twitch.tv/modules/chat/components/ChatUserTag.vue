<template>
	<span v-if="user && user.userDisplayName" class="seventv-chat-user" :style="{ color: color }">
		<!--Badge List -->
		<span v-if="twitchBadges.length || badges.length" class="seventv-chat-user-badge-list">
			<ChatBadge
				v-for="(badge, index) of twitchBadges"
				:key="index"
				:badge="badge"
				:alt="badge.title"
				type="twitch"
			/>
			<ChatBadge
				v-for="(badge, index) of badges"
				:key="index"
				:badge="badge"
				:alt="badge.data.tooltip"
				type="app"
			/>
		</span>

		<!-- Message Author -->
		<span class="seventv-chat-user-username">
			<span>{{ user.userDisplayName }}</span>
			<span v-if="user.isIntl"> ({{ user.userLogin }})</span>
		</span>
	</span>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ChatBadge from "./ChatBadge.vue";
import { normalizeUsername } from "@/site/twitch.tv/modules/chat/ChatBackend";
import { useChatAPI } from "@/site/twitch.tv/ChatAPI";
import { convertTwitchEmote } from "@/common/Transform";
const props = defineProps<{
	user: Twitch.ChatUser;

	badges?: Record<string, string>;
}>();

const { twitchBadgeSets, cosmetics, entitledUsers } = useChatAPI();
const twitchBadges = ref([] as Twitch.ChatBadge[]);

// 7TV Badges
const badges = computed<SevenTV.Cosmetic<"BADGE">[]>(() => {
	const ids = entitledUsers.value[props.user.userID]?.BADGE;
	if (!ids || !ids.length) return [];

	return (ids ? ids.map((id) => cosmetics.value[id]) : [])
		.filter((cos) => cos && cos.kind === "BADGE")
		.map((cos) => cos as SevenTV.Cosmetic<"BADGE">);
});

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

			twitchBadges.value.push(badge);

			convertTwitchEmote;
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
