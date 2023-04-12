<template>
	<Teleport v-if="displayLatency" to="#seventv-stream-info">
		<span class="seventv-stream-info" v-if="shouldShowVideoStats"> <GaugeIcon /> {{ videoLatency }} </span>
	</Teleport>
</template>

<script setup lang="ts">
import { declareConfig, useConfig } from "@/composable/useSettings";
import { declareModule } from "@/composable/useModule";
import { onMounted, onUnmounted, ref } from "vue";
import GaugeIcon from "@/assets/svg/icons/GaugeIcon.vue";

const { markAsReady } = declareModule("stream-info", {
	name: "Stream Info",
	depends_on: [],
});

const shouldShowVideoStats = useConfig<boolean>("channel.stream_info");
const displayLatency = ref<boolean>(false);
const videoLatency = ref<string>("");
const observer = new MutationObserver(updateVideoLatency);

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
	if (!latency) return;

	observer.observe(latency, { characterData: true, subtree: true });

	// Close the player settings
	playerSettingsElement.click();
}

function updateVideoLatency(mutationList: Array<MutationRecord>): void {
	mutationList.forEach((mutation: MutationRecord) => {
		switch (mutation.type) {
			case "characterData":
				videoLatency.value = mutation.target.textContent?.replace(" sec.", "s") ?? "";
				break;
		}
	});
}

onMounted(() => {
	findAndHideVideoStatsTable();

	// Needs improvement
	setTimeout(() => {
		const n = document.querySelector<HTMLElement>(".live-time");
		if (n) {
			const newEl = document.createElement("div");
			newEl.id = "seventv-stream-info";
			const liveTimer = document.querySelector<HTMLElement>("#seventv-stream-info");
			if (!liveTimer) {
				n.parentElement?.insertAdjacentElement("afterend", newEl);
			}
		}

		displayLatency.value = true;
	}, 10000);
});

onUnmounted(() => {
	observer.disconnect();
	videoLatency.value = "";
});

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("channel.stream_info", "TOGGLE", {
		path: ["Channel", "Stream-Info"],
		label: "Latency Info",
		hint: "Show Latency to Broadcaster",
		defaultValue: false,
	}),
];
</script>

<style>
.seventv-stream-info {
	font-family: Helvetica Neue, sans-serif;
	font-variant-numeric: tabular-nums;
}
.seventv-stream-info > svg {
	vertical-align: text-top;
}
</style>
