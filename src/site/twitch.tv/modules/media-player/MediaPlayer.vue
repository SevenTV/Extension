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
				<span>{{ liveLatency }}s</span>
			</div>
		</Teleport>
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, ref, toRef, watch } from "vue";
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
	videoStatsTeleportLocation: HTMLElement | null | undefined;
}>();

const teleportLocation = toRef(props, "videoStatsTeleportLocation");
const doTeleport = ref<boolean>(false);

const shouldShowVideoStats = useConfig<boolean>("player.video_stats");
const actionOnClick = useConfig<number>("player.action_onclick");

const mediaPlayerInstance = ref();
const liveLatency = ref<string>();
const videoStats = ref({
	droppedFrames: 0,
	playbackRate: 0,
	bitrate: "0",
	width: 0,
	height: 0,
	framerate: 0,
	bufferSize: 0,
});

definePropertyHook(props.instance.component, "props", {
	value: (v: Twitch.MediaPlayerComponent["props"]) => {
		mediaPlayerInstance.value = v.mediaPlayerInstance;

		// we need to re-add the event listener when the mediaPlayer props changes
		addClickHandler();
	},
});

watch(
	mediaPlayerInstance,
	(mediaPlayer, old) => {
		if (old && mediaPlayer !== old) {
			unsetPropertyHook(old.core.state, "liveLatency");
		} else {
			if (!mediaPlayer) return;

			definePropertyHook(mediaPlayer.core.state, "liveLatency", {
				value: (v: number) => {
					liveLatency.value = v?.toFixed(2) ?? "-.--";
				},
			});
		}
	},
	{ immediate: true },
);

watch(
	liveLatency,
	() => {
		const mediaPlayer = props.instance.component.props?.mediaPlayerInstance;
		if (mediaPlayer) {
			videoStats.value.droppedFrames = mediaPlayer.getDroppedFrames();
			videoStats.value.bitrate = (mediaPlayer.getVideoBitRate() / 1000)?.toFixed(0) ?? "0";
			videoStats.value.framerate = mediaPlayer.getVideoFrameRate();
			videoStats.value.playbackRate = mediaPlayer.getPlaybackRate();
			videoStats.value.width = mediaPlayer.getVideoWidth();
			videoStats.value.height = mediaPlayer.getVideoHeight();
			videoStats.value.bufferSize = mediaPlayer.getBufferDuration();
		}
	},
	{ immediate: true },
);

const videoStatsRef = ref();
const videoStatsTooltip = useTooltip(VideoStatsTooltip, videoStats.value);

watch(
	teleportLocation,
	(n) => {
		n ? (doTeleport.value = true) : (doTeleport.value = false);
	},
	{ immediate: true },
);

function pauseOnClick() {
	if (!props.instance.component.props) return;
	const mediaPlayer = props.instance.component.props.mediaPlayerInstance;
	if (mediaPlayer.isPaused()) {
		mediaPlayer.play();
	} else {
		mediaPlayer.pause();
	}
}

function muteOnClick() {
	if (!props.instance.component.props) return;
	const mediaPlayer = props.instance.component.props.mediaPlayerInstance;
	mediaPlayer.setMuted(!mediaPlayer.isMuted());
}

function addClickHandler() {
	const mediaPlayer = props.instance.component.props?.mediaPlayerInstance;
	if (!mediaPlayer) return;
	// getHTMLVideoELement function not working as expected
	const videoElement = mediaPlayer.core.mediaSinkManager.video;
	if (!videoElement || !videoElement.nextElementSibling) return;

	const overlayContainer = videoElement.nextElementSibling.querySelector<HTMLElement>(
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
watch(actionOnClick, addClickHandler);

onUnmounted(() => {
	unsetPropertyHook(props.instance.component.props.mediaPlayerInstance.core.state, "liveLatency");
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
