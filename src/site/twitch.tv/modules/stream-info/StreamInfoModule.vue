<template>
	<!-- Insert  -->
	<Teleport to="#seventv-stream-info">
		<div v-if="shouldShowVideoStats">
			{{ videoLatency }}
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { declareConfig, useConfig } from "@/composable/useSettings";
import { declareModule } from "@/composable/useModule";
import { onBeforeMount, onMounted, onUnmounted, ref } from "vue";

const { markAsReady } = declareModule("stream-info", {
	name: "Stream Info",
	depends_on: [],
});
const shouldShowVideoStats = useConfig<boolean>("channel.stream_info");

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

function updateVideoLatency(mutationList: any): void {
	mutationList.forEach((mutation: MutationRecord) => {
		switch (mutation.type) {
			case "characterData":
				videoLatency.value = mutation.target.textContent ?? "";
				break;
		}
	});
}

onBeforeMount(() => {
	const el = document.createElement("div");
	el.id = "seventv-stream-info";
	const liveTimer = document.querySelector<HTMLElement>(".live-time")?.parentElement;
	if (liveTimer) {
		liveTimer.insertAdjacentElement("afterend", el);
	}
});

onMounted(() => {
	findAndHideVideoStatsTable();
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
		label: "Stream Info",
		hint: "Show additional information about stream",
		defaultValue: false,
	}),
];
</script>
