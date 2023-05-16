<template>
	<template v-if="shouldShowVideoStats">
		<Teleport v-if="doTeleport" :to="teleportLocation">
			<div
				id="seventv-video-stats"
				ref="videoStatsRef"
				@mouseenter="videoStatsTooltip.show(videoStatsRef)"
				@mouseleave="videoStatsTooltip.hide()"
			>
				<figure v-if="videoStats.playbackRate > 1"><ForwardIcon /></figure>
				<figure v-else><GaugeIcon /></figure>
				<span>{{ videoStats.liveLatency }}s</span>
			</div>
		</Teleport>
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, ref, toRef, watch } from "vue";
import { isNumber } from "@vueuse/core";
import { HookedInstance } from "@/common/ReactHooks";
import {
	defineNamedEventHandler,
	definePropertyHook,
	unsetNamedEventHandler,
	unsetPropertyHook,
} from "@/common/Reflection";
import { useConfig } from "@/composable/useSettings";
import { useTooltip } from "@/composable/useTooltip";
import ForwardIcon from "@/assets/svg/icons/ForwardIcon.vue";
import GaugeIcon from "@/assets/svg/icons/GaugeIcon.vue";
import VideoStatsTooltip from "./VideoStatsTooltip.vue";

const props = defineProps<{
	instance: HookedInstance<Twitch.MediaPlayerComponent>;
	videoStatsTeleportLocation: HTMLElement | undefined;
}>();

const teleportLocation = toRef(props, "videoStatsTeleportLocation");
const doTeleport = ref<boolean>(false);

const shouldShowVideoStats = useConfig<boolean>("player.video_stats");
const actionOnClick = useConfig<number>("player.action_onclick");

const mediaPlayerProps = ref<Twitch.MediaPlayerComponent["props"]>();
// const statePath = ref<string>();
const videoStats = ref({
	liveLatency: "-.--",
	droppedFrames: 0,
	playbackRate: 0,
	bitrate: "0",
	width: 0,
	height: 0,
	framerate: 0,
});

if (props.instance.component.props) {
	definePropertyHook(props.instance.component, "props", {
		value: (v: Twitch.MediaPlayerComponent["props"]) => {
			mediaPlayerProps.value = v;
			if (v.mediaPlayerInstance) {
				definePropertyHook(v.mediaPlayerInstance.core, "state", {
					value: (v) => {
						definePropertyHook(v, "liveLatency", {
							value: (v) => {
								if (isNumber(v)) videoStats.value.liveLatency = v?.toFixed(2) ?? "-.--";
							},
						});
						definePropertyHook(v, "statistics", {
							value: (v) => {
								definePropertyHook(v, "droppedFrames", {
									value: (v) => {
										if (isNumber(v)) videoStats.value.droppedFrames = v;
									},
								});
								definePropertyHook(v, "bitrate", {
									value: (v) => {
										if (isNumber(v)) videoStats.value.bitrate = (v / 1000)?.toFixed(0) ?? "0";
									},
								});
								definePropertyHook(v, "framerate", {
									value: (v) => {
										if (isNumber(v)) videoStats.value.framerate = v;
									},
								});
							},
						});
						definePropertyHook(v, "playbackRate", {
							value: (v) => {
								// Twitch automatically applies a 1.03x speed up when latency is large
								if (isNumber(v)) videoStats.value.playbackRate = v;
							},
						});
						definePropertyHook(v, "quality", {
							value: (v) => {
								definePropertyHook(v, "height", {
									value: (v) => {
										if (isNumber(v)) videoStats.value.height = v;
									},
								});
								definePropertyHook(v, "width", {
									value: (v) => {
										if (isNumber(v)) videoStats.value.width = v;
									},
								});
							},
						});
						// if (v.path) {
						//     statePath.value = v.path;
						// }
					},
				});
			}
		},
	});
}

const videoStatsRef = ref();
const videoStatsTooltip = useTooltip(VideoStatsTooltip, videoStats.value);

watch(videoStats, (n) => {
	videoStats.value = n;
});

watch(
	teleportLocation,
	(n) => {
		n ? (doTeleport.value = true) : (doTeleport.value = false);
	},
	{ immediate: true },
);

function pauseOnClick() {
	if (!mediaPlayerProps.value) return;
	const mediaPlayer = props.instance.component.props;
	if (props.instance.component.isCurrentlyPlaying(mediaPlayer)) {
		props.instance.component.pause(mediaPlayer);
	} else {
		props.instance.component.play(mediaPlayer);
	}
}

function muteOnClick() {
	if (!mediaPlayerProps.value) return;
	const mediaPlayer = props.instance.component.props;
	props.instance.component.setMuted(!props.instance.component.getMuted(mediaPlayer), { userTriggered: true });
}

function addClickHandler() {
	const videoElement = props.instance.component.props?.mediaPlayerInstance?.core?.mediaSinkManager?.video;
	if (!videoElement) return;

	const overlayContainer = videoElement.nextElementSibling?.querySelector<HTMLElement>(
		"div[data-a-target='player-overlay-click-handler']",
	);

	if (!overlayContainer) return;

	if (actionOnClick.value === 1) {
		defineNamedEventHandler(overlayContainer, "PlayerActionOnClick", "click", pauseOnClick);
	} else if (actionOnClick.value === 2) {
		defineNamedEventHandler(overlayContainer, "PlayerActionOnClick", "click", muteOnClick);
	} else {
		unsetNamedEventHandler(overlayContainer, "PlayerActionOnClick", "click");
	}
}

// watch for setting changes of the "action"
watch(actionOnClick, addClickHandler, { immediate: true });

// watch for video path changes of player
watch(mediaPlayerProps, () => {
	// we need to re-add the event listener when the mediaPlayer path changes
	addClickHandler();
});

onUnmounted(() => {
	unsetPropertyHook(props.instance.component.props.mediaPlayerInstance?.core.state, "liveLatency");
	unsetPropertyHook(props.instance.component.props.mediaPlayerInstance?.core.state.statistics, "droppedFrames");
	unsetPropertyHook(props.instance.component.props.mediaPlayerInstance?.core.state, "statistics");
	unsetPropertyHook(props.instance.component.props.mediaPlayerInstance?.core.state.quality, "width");
	unsetPropertyHook(props.instance.component.props.mediaPlayerInstance?.core.state.quality, "height");
	unsetPropertyHook(props.instance.component.props.mediaPlayerInstance?.core.state.quality, "framerate");
	unsetPropertyHook(props.instance.component.props.mediaPlayerInstance?.core.state, "quality");
	unsetPropertyHook(props.instance.component.props.mediaPlayerInstance?.core, "state");
	unsetPropertyHook(props.instance.component.props.mediaPlayerInstance?.core.mediaSinkManager, "video");
	unsetPropertyHook(props.instance.component, "props");
});
</script>

<style lang="scss">
#seventv-video-stats {
	margin-right: 1rem !important;
	display: inline-flex;
	font-family: "Helvetica Neue", sans-serif;
	font-variant-numeric: tabular-nums;
}
#seventv-video-stats > figure {
	display: flex !important;
	align-items: center !important;
	justify-content: center !important;
	padding-right: 0.5rem;
}
</style>
