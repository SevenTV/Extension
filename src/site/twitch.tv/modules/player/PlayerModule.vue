<template>
	<template v-for="inst of player.instances" :key="inst.identifier">
		<PlayerController :inst="inst" :media-player="mediaPlayer" />
	</template>

	<template v-for="(inst, i) of streamInfo.instances" :key="inst.identifier">
		<PlayerStreamInfo
			:inst="inst"
			:advanced-controls="playerAdvancedOptionsComponent.instances[i]"
			:media-player="mediaPlayer"
		/>
	</template>
</template>

<script setup lang="ts">
import { useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import { declareConfig } from "@/composable/useSettings";
import PlayerController from "./PlayerController.vue";
import { ref } from "vue";
import PlayerStreamInfo from "./PlayerStreamInfo.vue";

declareModule<"TWITCH">("player", {
	name: "Player",
	depends_on: [],
});

const mediaPlayer = ref<Twitch.MediaPlayerInstance>();

const player = useComponentHook<Twitch.VideoPlayerComponent>(
	{
		predicate: (n) => n.props && n.props.containerRef && n.props.mediaPlayerInstance,
	},
	{
		hooks: {
			render(inst, cur) {
				mediaPlayer.value = inst.component.props.mediaPlayerInstance;

				return cur;
			},
		},
	},
);

// hook for the media player instance advanced controls
const playerAdvancedOptionsComponent = useComponentHook<Twitch.MediaPlayerAdvancedControls>({
	predicate: (el) => el.props && el.setStatsOverlay,
});

// hook to render video stats in the channel page view
const streamInfo = useComponentHook<Twitch.StreamInfo>(
	{
		parentSelector: "#live-channel-stream-information",
		predicate: (el) => el.props && el.props.liveSince,
	},
	{
		trackRoot: true,
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
