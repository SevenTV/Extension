<template />

<script setup lang="ts">
import { declareModule } from "@/composable/useModule";
import { declareConfig, useConfig } from "@/composable/useSettings";
import { watchEffect } from "vue";

const { markAsReady } = declareModule("video-player", {
	name: "Video Player",
	depends_on: [],
});

const pauseOnClickEnabled = useConfig<boolean>("channel.video_player.pause_on_click");

const videoPlayerClickHandler = document.querySelector('div[data-a-target="player-overlay-click-handler"]');
const video = document.querySelector('div[data-a-target="video-player"] video') as HTMLMediaElement;

function pauseOnClick(): void {
	if (video && !video.paused) {
		video.pause();
	}
}

watchEffect(() => {
	if (videoPlayerClickHandler) {
		if (pauseOnClickEnabled.value) {
			videoPlayerClickHandler.addEventListener("click", pauseOnClick);
		} else {
			videoPlayerClickHandler.removeEventListener("click", pauseOnClick);
		}
	}
});

markAsReady();
</script>

<script lang="ts">
/**
 * Settings configuration for video player
 */
export const config = [
	declareConfig("channel.video_player.pause_on_click", "TOGGLE", {
		path: ["Channel", "Video Player"],
		label: "Pause Stream on Click",
		hint: "If checked, the stream can be paused and unpaused by clicking the video player",
		defaultValue: false,
	}),
];
</script>
