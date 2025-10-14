<template></template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from "vue";
import { declareModule } from "@/composable/useModule";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { declareConfig } from "@/composable/useSettings";
import { useEloWardRanks } from "./composables/useEloWardRanks";
import { useGameDetection } from "./composables/useGameDetection";

const { dependenciesMet, markAsReady } = declareModule("eloward", {
	name: "EloWard",
	depends_on: ["chat"],
});

const ctx = useChannelContext();
const elowardRanks = useEloWardRanks();
const gameDetection = useGameDetection();

onMounted(() => {
	if (dependenciesMet.value) {
		markAsReady();
	}
});

// Watch for League of Legends stream detection
watch(
	() => gameDetection.isLeagueStream.value,
	(isLeague) => {
		// Clear cache when switching between League and non-League streams
		if (!isLeague) {
			elowardRanks.clearCache();
		}
	},
);

// Watch for channel changes to clear cache
watch(
	() => ctx.id,
	(newChannelId, oldChannelId) => {
		if (newChannelId !== oldChannelId && newChannelId) {
			// Clear cache when switching channels
			elowardRanks.clearCache();
		}
	},
);

onUnmounted(() => {
	elowardRanks.clearCache();
});
</script>

<script lang="ts">
// Configuration declarations
export const config = [
	declareConfig("eloward.enabled", "TOGGLE", {
		path: ["Chat", "EloWard"],
		label: "Enable EloWard Rank Badges",
		hint: "Show League of Legends rank badges next to usernames in chat",
		defaultValue: true,
	}),
	declareConfig("eloward.league_only", "TOGGLE", {
		path: ["Chat", "EloWard"],
		label: "Show Only on League Streams",
		hint: "Only show rank badges when watching League of Legends streams",
		defaultValue: true,
	}),
	declareConfig("eloward.animated_badges", "TOGGLE", {
		path: ["Chat", "EloWard"],
		label: "Animated Badges",
		hint: "Use animated rank badges for higher ranks (Master, Grandmaster, Challenger)",
		defaultValue: true,
	}),
	declareConfig("eloward.show_tooltips", "TOGGLE", {
		path: ["Chat", "EloWard"],
		label: "Show Rank Tooltips",
		hint: "Show detailed rank information when hovering over badges",
		defaultValue: true,
	}),
];
</script>
