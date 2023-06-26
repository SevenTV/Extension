<template>
	<template v-for="inst of player.instances" :key="inst.identifier">
		<PlayerController
			:inst="inst"
			:video-stats-teleport-location="videoStatsTeleportLocation"
			:advanced-controls="playerAdvancedOptionsComponent.instances"
		/>
	</template>
</template>

<script setup lang="ts">
import { HookedInstance, useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import { declareConfig } from "@/composable/useSettings";
import PlayerController from "./PlayerController.vue";
import { ref } from "vue";

declareModule<"TWITCH">("player", {
	name: "Player",
	depends_on: [],
});

const player = useComponentHook<Twitch.VideoPlayerComponent>(
	{
		predicate: (n) => n.props && n.props.containerRef && n.props.mediaPlayerInstance,
	},
	{
		hooks: {
			render(inst, cur) {
				return cur;
			},
		},
	},
);

const videoStatsTeleportLocation = ref<HTMLElement | null | undefined>();

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

// hook to render video stats in the mod view
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
</script>

<script lang="ts">
export const config = [
	declareConfig("player.skip_content_restriction", "TOGGLE", {
		label: "Skip Content Warnings",
		hint: "Automatically skip the 'intended for mature audiences' dialog on some streams",
		path: ["Player", ""],
		defaultValue: false,
	}),
	declareConfig("player.video_stats", "TOGGLE", {
		path: ["Player", ""],
		label: "Video Stats",
		hint: "Show Latency to Broadcaster with a tooltip of other video stats",
		defaultValue: false,
	}),
	declareConfig("player.action_onclick", "DROPDOWN", {
		path: ["Player", ""],
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
