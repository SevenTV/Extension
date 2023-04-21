<template>
	<Teleport v-if="doTeleport" :to="teleportLocation">
		<div v-if="shouldShowVideoStats" id="seventv-stream-info">
			<figure><GaugeIcon /></figure>
			<span>{{ videoLatency }}s</span>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { declareConfig, useConfig } from "@/composable/useSettings";
import { declareModule } from "@/composable/useModule";
import { onMounted, onUnmounted, ref } from "vue";
import { useComponentHook } from "@/common/ReactHooks";
import GaugeIcon from "@/assets/svg/icons/GaugeIcon.vue";

const { markAsReady } = declareModule("stream-info", {
	name: "Stream Info",
	depends_on: [],
});

const shouldShowVideoStats = useConfig<boolean>("channel.latency_info");
const teleportLocation = ref<HTMLElement>();
const doTeleport = ref<boolean>(false);
const videoLatency = ref<string>("-.--");

const mediaPlayerInstanceComponent = useComponentHook<Twitch.MediaPlayerInstanceComponent>({
	predicate: (el) => el.props && el.props.mediaPlayerInstance,
});

onMounted(() => {
	setInterval(() => {
		// find the viewer count element and set teleport location to sibling of common parent
		// This works for the Main Channel view and the Mod View
		const teleLoc = document.querySelector<HTMLElement>("[data-a-target*='channel-viewers-count']")?.parentElement
			?.parentElement?.parentElement;
		if (teleLoc) {
			teleportLocation.value = teleLoc;
			doTeleport.value = true;
		} else {
			doTeleport.value = false;
		}

		// TODO: research other scenarios such as squad streaming, etc.
		// Only retrive data for 1 player
		if (mediaPlayerInstanceComponent.instances.length === 1) {
			const videoStats = mediaPlayerInstanceComponent.instances[0]?.component.getPlayerMetadata();
			// Latency value doesn't change when ads play
			if (videoStats.latencyToBroadcaster < 100) {
				videoLatency.value = "-.--";
			} else {
				videoLatency.value = (videoStats.latencyToBroadcaster / 1000).toFixed(2);
			}
		}
	}, 2000);
});

onUnmounted(() => {
	doTeleport.value = false;
});

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("channel.latency_info", "TOGGLE", {
		path: ["Channel", "Stream-Info"],
		label: "Latency Info",
		hint: "Show Latency to Broadcaster",
		defaultValue: false,
	}),
];
</script>

<style>
#seventv-stream-info {
	margin-right: 1rem !important;
	display: inline-flex;
	font-family: "Helvetica Neue", sans-serif;
	font-variant-numeric: tabular-nums;
}
#seventv-stream-info > figure {
	display: flex !important;
	align-items: center !important;
	justify-content: center !important;
	padding-right: 0.5rem;
}
</style>
