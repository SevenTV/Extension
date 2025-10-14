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

onMounted(async () => {
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
		hint: "Show League of Legends rank badges next to usernames when watching League of Legends streams",
		defaultValue: true,
	}),
];
</script>
