<template>
	<template v-for="inst in mediaPlayerComponent.instances" :key="inst.identifier">
		<MediaPlayer
			:instance="inst"
			:video-stats-teleport-location="videoStatsTeleportLocation"
			:advanced-controls="playerAdvancedOptionsComponent.instances"
		/>
	</template>
</template>

<script setup lang="ts">
import { declareConfig } from "@/composable/useSettings";
import { declareModule } from "@/composable/useModule";
import { HookedInstance, useComponentHook } from "@/common/ReactHooks";
import { ref } from "vue";
import MediaPlayer from "./MediaPlayer.vue";

const { markAsReady } = declareModule("media-player", {
	name: "Media Player",
	depends_on: [],
});

const videoStatsTeleportLocation = ref<HTMLElement | null | undefined>();

// hook for the media player instance
const mediaPlayerComponent = useComponentHook<Twitch.MediaPlayerComponent>({
	predicate: (el) => el.setPlayerActive && el.props && el.props.playerEvents && el.props.mediaPlayerInstance,
});

// hook for the media player instance advanced controls
const playerAdvancedOptionsComponent = useComponentHook<Twitch.MediaPlayerAdvancedControls>({
	predicate: (el) => el.props && el.setStatsOverlay,
});

// hook to render video stats in the channel page view
useComponentHook(
	{
		parentSelector: "#live-channel-stream-information",
		predicate: (el) => el.props && el.props.liveSince,
	},
	{
		trackRoot: true,
		hooks: {
			update(inst) {
				const rootNode = inst.domNodes.root;
				if (!rootNode) return;
				const teleLoc = rootNode.querySelector<HTMLElement>("[data-a-target*='channel-viewers-count']")
					?.parentElement?.parentElement?.parentElement;
				videoStatsTeleportLocation.value = teleLoc;
			},
		},
	},
);

// // hook to render video stats in the mod view
useComponentHook(
	{
		parentSelector: ".modview-player-widget__viewcount",
		predicate: (el) => el.props && el.props.data && el.props.data.user,
	},
	{
		hooks: {
			update(inst) {
				const teleLoc = (inst as HookedInstance<Twitch.ModViewViewerCount>).component.DOMNode.parentElement
					?.parentElement;
				videoStatsTeleportLocation.value = teleLoc;
			},
		},
	},
);

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("player.video_stats", "TOGGLE", {
		path: ["Player", "General"],
		label: "Video Stats",
		hint: "Show Latency to Broadcaster with a tooltip of other video stats",
		defaultValue: false,
	}),
	declareConfig("player.action_onclick", "DROPDOWN", {
		path: ["Player", "Playback"],
		label: "Action on Click",
		hint: "Choose an action to perform when clicking on the video player. (This setting may not work in channels with extensions shown)",
		options: [
			["None", 0],
			["Pause/Unpause", 1],
			["Mute/Unmute", 2],
		],
		defaultValue: 0,
	}),
];
</script>
