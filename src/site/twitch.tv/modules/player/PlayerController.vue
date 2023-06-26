<template>
	<template v-if="shouldHideContentWarning && contentWarning">
		<PlayerContentWarning v-for="x of contentWarning.instances" :key="x.identifier" :inst="x" />
	</template>
	<template v-if="shouldShowVideoStats">
		<Teleport v-if="doTeleport" :to="teleportLocation">
			<div
				id="seventv-video-stats"
				ref="videoStatsRef"
				@click="openStatsOverlay"
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
1

<script setup lang="ts">
import { onUnmounted, ref, toRef, watch, watchEffect } from "vue";
import { debounceFn } from "@/common/Async";
import { HookedInstance, ReactComponentHook, defineComponentHook, unhookComponent } from "@/common/ReactHooks";
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
import PlayerContentWarning from "./PlayerContentWarning.vue";
import VideoStatsTooltip from "./VideoStatsTooltip.vue";

const props = defineProps<{
	inst: HookedInstance<Twitch.VideoPlayerComponent>;
	videoStatsTeleportLocation: HTMLElement | null | undefined;
	advancedControls: Array<HookedInstance<Twitch.MediaPlayerAdvancedControls>>;
}>();

const shouldHideContentWarning = useConfig<boolean>("player.skip_content_restriction");
const shouldShowVideoStats = useConfig<boolean>("player.video_stats");
const actionOnClick = useConfig<number>("player.action_onclick");

const contentWarning = ref<ReactComponentHook<Twitch.VideoPlayerContentRestriction> | null>(null);
const teleportLocation = toRef(props, "videoStatsTeleportLocation");
const doTeleport = ref<boolean>(false);

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

props.inst.component.props.containerRef.classList.add("seventv-player");

const hookContentWarning = debounceFn((): void => {
	if (contentWarning.value) {
		unhookComponent(contentWarning.value as ReactComponentHook<Twitch.VideoPlayerContentRestriction>);
	}

	contentWarning.value = defineComponentHook<Twitch.VideoPlayerContentRestriction>({
		parentSelector: ".seventv-player",
		predicate: (n) =>
			n.props && typeof n.props.restrictions === "object" && typeof n.props.liftRestriction === "function",
	});
}, 100);

watch(
	shouldHideContentWarning,
	(v) => {
		if (!v) return;

		hookContentWarning();
	},
	{
		immediate: true,
	},
);

definePropertyHook(props.inst.component, "props", {
	value: (v: Twitch.VideoPlayerComponent["props"]) => {
		hookContentWarning();

		mediaPlayerInstance.value = v.mediaPlayerInstance;
		// we need to re-add the event listener when the mediaPlayer props changes
		addClickHandler();
	},
});

watchEffect(() => {
	const e = props.inst.component.props.containerRef as HTMLDivElement;
	if (!e) return;

	e.classList.toggle("seventv-player-hide-content-warning", shouldHideContentWarning.value);
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

function openStatsOverlay() {
	if (props.advancedControls.length !== 1) return;
	const controls = props.advancedControls[0].component;
	const isOpen = document.querySelector("[data-a-target='player-overlay-video-stats']");
	controls.setStatsOverlay(isOpen ? 0 : 1);
}

function pauseOnClick() {
	if (!props.inst.component.props) return;
	const mediaPlayer = props.inst.component.props.mediaPlayerInstance;
	if (mediaPlayer.isPaused()) {
		mediaPlayer.play();
	} else {
		mediaPlayer.pause();
	}
}

function muteOnClick() {
	if (!props.inst.component.props) return;
	const mediaPlayer = props.inst.component.props.mediaPlayerInstance;
	mediaPlayer.setMuted(!mediaPlayer.isMuted());
}

function addClickHandler() {
	const mediaPlayer = props.inst.component.props?.mediaPlayerInstance;
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

watch(
	liveLatency,
	() => {
		const mediaPlayer = props.inst.component.props?.mediaPlayerInstance;
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

// watch for setting changes of the "action"
watch(actionOnClick, addClickHandler);

onUnmounted(() => {
	if (contentWarning.value) {
		unhookComponent(contentWarning.value as ReactComponentHook<Twitch.VideoPlayerContentRestriction>);
	}
	unsetPropertyHook(props.inst.component.props.mediaPlayerInstance.core.state, "liveLatency");
	unsetPropertyHook(props.inst.component, "props");
});
</script>

<style lang="scss">
:root {
	.seventv-player.seventv-player-hide-content-warning {
		.disclosure-tool {
			display: none !important;
		}
	}
}

#seventv-video-stats {
	margin-right: 1rem !important;
	display: inline-flex;
	font-family: "Helvetica Neue", sans-serif;
	font-variant-numeric: tabular-nums;
	cursor: pointer;

	&:hover {
		background: hsla(0deg, 0%, 30%, 32%);
	}
}

#seventv-video-stats > figure {
	display: flex !important;
	align-items: center !important;
	justify-content: center !important;
	padding-right: 0.5rem;
}
</style>
