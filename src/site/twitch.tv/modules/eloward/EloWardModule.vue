<template></template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted, watchEffect } from "vue";
import { declareModule } from "@/composable/useModule";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { declareConfig, useConfig } from "@/composable/useSettings";
import { useEloWardRanks } from "./composables/useEloWardRanks";
import { useGameDetection } from "./composables/useGameDetection";

const DEV_MODE = import.meta.env.DEV;
// Temporarily enable logging in production for debugging
const ENABLE_LOGGING = true;
function log(message: string, data?: unknown) {
	if (DEV_MODE || ENABLE_LOGGING) {
		console.log(`[EloWard Module] ${message}`, data || "");
	}
}

log("🚀 EloWard Module - SCRIPT EXECUTED");

const { dependenciesMet, markAsReady, ready } = declareModule("eloward", {
	name: "EloWard",
	depends_on: ["chat"],
});

log("📦 Module declared, waiting for dependencies", { dependenciesMet: dependenciesMet.value });

const ctx = useChannelContext();
const elowardRanks = useEloWardRanks();
const gameDetection = useGameDetection();
const elowardEnabled = useConfig<boolean>("eloward.enabled");

log("⚙️ Composables initialized", {
	channelId: ctx.id,
	enabled: elowardEnabled.value,
	isLeagueStream: gameDetection.isLeagueStream.value,
});

// Watch dependencies being met
watchEffect(() => {
	log("👀 Dependencies status changed", { dependenciesMet: dependenciesMet.value });
});

// Watch module ready state
watchEffect(() => {
	log("✅ Module ready state changed", { ready: ready.value });
});

// Watch enabled setting
watch(elowardEnabled, (newVal) => {
	log("⚙️ EloWard enabled setting changed", { enabled: newVal });
});

onMounted(async () => {
	log("🔧 onMounted called", { dependenciesMet: dependenciesMet.value });

	if (dependenciesMet.value) {
		markAsReady();
		log("✨ Module marked as READY");
	} else {
		log("⏳ Waiting for dependencies to be met...");
		const unwatch = watch(dependenciesMet, (met) => {
			if (met) {
				log("✅ Dependencies met, marking as ready");
				markAsReady();
				unwatch();
			}
		});
	}
});

// Watch for League of Legends stream detection
watch(
	() => gameDetection.isLeagueStream.value,
	(isLeague, wasLeague) => {
		log("🎮 League stream detection changed", { isLeague, wasLeague });
		// Clear cache when switching between League and non-League streams
		if (!isLeague) {
			elowardRanks.clearCache();
			log("🗑️ Cache cleared (left League stream)");
		}
	},
);

// Watch for channel changes to clear cache
watch(
	() => ctx.id,
	(newChannelId, oldChannelId) => {
		log("📺 Channel changed", { from: oldChannelId, to: newChannelId });
		if (newChannelId !== oldChannelId && newChannelId) {
			// Clear cache when switching channels
			elowardRanks.clearCache();
			log("🗑️ Cache cleared (channel change)");
		}
	},
);

onUnmounted(() => {
	log("🔴 Module UNMOUNTING");
	elowardRanks.clearCache();
});

// Expose debug info to window for manual inspection
if ((DEV_MODE || ENABLE_LOGGING) && typeof window !== "undefined") {
	(window as any).__ELOWARD_DEBUG__ = {
		getStatus: () => ({
			moduleReady: ready.value,
			dependenciesMet: dependenciesMet.value,
			enabled: elowardEnabled.value,
			isLeagueStream: gameDetection.isLeagueStream.value,
			currentGame: gameDetection.currentGame.value,
			channelId: ctx.id,
			cacheSize: elowardRanks.cacheSize(),
		}),
		clearCache: () => elowardRanks.clearCache(),
		forceUpdate: () => gameDetection.updateGame(),
	};
	log("🐛 Debug interface available at window.__ELOWARD_DEBUG__");
	log("🐛 Try: __ELOWARD_DEBUG__.getStatus()");
}
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
