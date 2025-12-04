<template></template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from "vue";
import { declareModule } from "@/composable/useModule";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { declareConfig, useConfig } from "@/composable/useSettings";
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
	} else {
		const unwatch = watch(dependenciesMet, (met) => {
			if (met) {
				markAsReady();
				unwatch();
			}
		});
	}
});

// Clear cache when leaving League streams
watch(
	() => gameDetection.isLeagueStream.value,
	(isLeague) => {
		if (!isLeague) {
			elowardRanks.clearCache();
		}
	},
);

// Clear cache when switching channels
watch(
	() => ctx.id,
	(newChannelId, oldChannelId) => {
		if (newChannelId !== oldChannelId && newChannelId) {
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
		path: ["Appearance", "Vanity"],
		label: "EloWard Rank Badges",
		hint: "Show League of Legends rank badges next to usernames when watching League of Legends streams",
		defaultValue: true,
	}),
];
</script>
