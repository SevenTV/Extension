<template>
	<!-- EloWard Module - Handles League of Legends rank badges in chat -->
</template>

<script setup lang="ts">
import { watch } from "vue";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import { useEloWardRanks } from "./composables/useEloWardRanks";
import { useGameDetection } from "./composables/useGameDetection";

const { dependenciesMet, markAsReady } = declareModule("eloward", {
	name: "EloWard",
	depends_on: ["chat"],
});

const ctx = useChannelContext();
const elowardRanks = useEloWardRanks();
const gameDetection = useGameDetection();

// Wait for chat module to be ready
await dependenciesMet;

// Hook into Twitch's StreamInfo component to detect current game
const streamInfo = useComponentHook<Twitch.StreamInfo>({
	parentSelector: ".stream-info",
	predicate: (n) => n.props && n.props.channelID,
});

// Watch for stream info changes to detect game category
watch(
	() => streamInfo.instances,
	(instances) => {
		if (instances.length > 0) {
			const streamData = instances[0].component.props;
			gameDetection.updateStreamInfo(streamData);
		}
	},
	{ immediate: true }
);

// Watch for game changes and enable/disable EloWard accordingly
watch(
	() => gameDetection.isLeagueStream,
	(isLeague) => {
		if (isLeague) {
			elowardRanks.enable();
		} else {
			elowardRanks.disable();
		}
	},
	{ immediate: true }
);

// Watch for channel changes
watch(
	() => ctx.id,
	(newChannelId, oldChannelId) => {
		if (newChannelId !== oldChannelId) {
			elowardRanks.clearCache();
		}
	}
);

markAsReady();
</script>

<script lang="ts">
import { declareConfig, useConfig } from "@/composable/useSettings";

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
	declareConfig("eloward.cache_duration", "SLIDER", {
		path: ["Chat", "EloWard"],
		label: "Cache Duration",
		hint: "How long to cache rank data before refreshing (in minutes)",
		options: {
			min: 5,
			max: 60,
			step: 5,
			unit: "min",
		},
		defaultValue: 15,
	}),
];
</script>
