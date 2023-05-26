<template />

<script setup lang="ts">
import { log } from "@/common/Logger";
import { declareModule } from "@/composable/useModule";
import { useConfig } from "@/composable/useSettings";
import { declareConfig } from "@/composable/useSettings";
import { watchEffect } from "vue";

const { markAsReady } = declareModule("hd-video", {
	name: "HD Video",
	depends_on: [""],
});

const enableHDVideo = useConfig<boolean>("general.hd-video.enabled");

watchEffect(() => {
	if (enableHDVideo.value) {
		try {
			document.addEventListener(
				"visibilitychange",
				(e) => {
					e.stopImmediatePropagation();
				},
				true,
			);
			log.info("Enabled hd video");
		} catch (err) {
			log.warn("Unable to install document visibility hook.", err);
		}
	} else {
		try {
			document.removeEventListener("visibilitychange", (e) => {
				e.stopImmediatePropagation();
			});
			log.info("Disabled hd video");
		} catch (err) {
			log.warn("Unable to uninstall document visibility hook.", err);
		}
	}
});

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("general.hd-video.enabled", "TOGGLE", {
		label: "Prevent Video Quality Drop",
		hint: "Prevent the video quality from dropping below the selected quality.",
		path: ["Channel", "Video Player"],
		defaultValue: true,
	}),
];
</script>
