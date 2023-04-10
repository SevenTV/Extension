<template>
	<!-- Insert  -->
	<Teleport to="#seventv-stream-info">
		<div v-if="shouldShowVideoStats">
			{{ videoLatencyRef?.innerText }}
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { declareConfig, useConfig } from "@/composable/useSettings";
import { declareModule } from "@/composable/useModule";
import { Ref, onMounted, onUnmounted, ref, watch } from "vue";

const { markAsReady } = declareModule("stream-info", {
	name: "Stream Info",
	depends_on: [],
});
const shouldShowVideoStats = useConfig<boolean>("channel.stream_info");
const el = document.createElement("div");
el.id = "seventv-stream-info";
const containerEl = ref<HTMLElement>(el);
let liveTimer = document.querySelector<HTMLElement>(".live-time")?.parentElement;
const streamInfo = document.querySelector<HTMLElement>("#seventv-stream-info");
if (!streamInfo && liveTimer) {
	liveTimer.insertAdjacentElement("afterend", containerEl.value);
}

const videoLatencyRef = ref<HTMLElement>();

function findAndHideVideoStatsTable() {
	const channelPlayerElement = document.querySelector<HTMLElement>("#channel-player");
	if (!channelPlayerElement) return;

	// Get the player settings button
	const playerSettingsElement = channelPlayerElement.querySelector<HTMLElement>("button[aria-label='Settings']");
	if (!playerSettingsElement) return;
	// Open the player settings
	playerSettingsElement.click();

	const settingsModalElement = document.querySelector<HTMLElement>("div[data-a-target='player-settings-menu']");
	if (!settingsModalElement) return;

	// Find the advanced settings
	const advancedElement = settingsModalElement.querySelector<HTMLElement>(
		"button[data-a-target='player-settings-menu-item-advanced']",
	);
	if (!advancedElement) return;
	advancedElement.click();

	const videoStatsElement = settingsModalElement.querySelectorAll<HTMLElement>("label.tw-toggle__button")[2];
	if (!videoStatsElement) return;

	let videoStatsTableElement = document.querySelector<HTMLElement>("div[data-a-target='player-overlay-video-stats']");
	// Only open the video stats once
	if (!videoStatsTableElement) videoStatsElement.click();
	// If opening didn't work, we return
	videoStatsTableElement = document.querySelector<HTMLElement>("div[data-a-target='player-overlay-video-stats']");
	if (!videoStatsTableElement) return;
	// We set the display to none
	videoStatsTableElement.style.setProperty("display", "none");
	const latency = videoStatsTableElement.querySelector<HTMLElement>("p[aria-label='Latency To Broadcaster']");
	// console.log(latency);
	if (!latency) return;
	videoLatencyRef.value = latency;

	// Close the player settings
	playerSettingsElement.click();
}

function updateVideoStats() {
	let videoStatsTableElement = document.querySelector<HTMLElement>("div[data-a-target='player-overlay-video-stats']");
	if (!videoStatsTableElement) return;
	const latency = videoStatsTableElement.querySelector<HTMLElement>("p[aria-label='Latency To Broadcaster']");
	// console.log(latency);
	if (!latency) return;
	videoLatencyRef.value = latency;
}

watch(videoLatencyRef, updateVideoStats);

onMounted(() => {
	findAndHideVideoStatsTable();
});

onUnmounted(() => {});

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("channel.stream_info", "TOGGLE", {
		path: ["Channel", "Stream-Info"],
		label: "Stream Info",
		hint: "Show additional information about stream",
		defaultValue: false,
	}),
];
</script>
