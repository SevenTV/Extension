<template>
	<Teleport v-if="displayLatency" to="#seventv-stream-info">
		<figure><GaugeIcon /></figure>
		<span v-if="shouldShowVideoStats" class="seventv-stream-info">{{ videoLatency }}s</span>
	</Teleport>
</template>

<script setup lang="ts">
import { declareConfig, useConfig } from "@/composable/useSettings";
import { declareModule } from "@/composable/useModule";
import { onMounted, onUnmounted, ref } from "vue";
import GaugeIcon from "@/assets/svg/icons/GaugeIcon.vue";
import { useComponentHook } from "@/common/ReactHooks";

const { markAsReady } = declareModule("stream-info", {
	name: "Stream Info",
	depends_on: [],
});

const shouldShowVideoStats = useConfig<boolean>("channel.latency_info");
const displayLatency = ref<boolean>(false);
const videoLatency = ref<string>("");

const mediaPlayerComponent = useComponentHook<Twitch.MediaPlayerInstanceComponent>({
	predicate: (el) => el.props && el.props.mediaPlayerInstance,
});

// This does not render instaneously
// Need to find alternative hook for rendering the stream-info element
useComponentHook<ReactExtended.AnyReactComponent>(
	{
		predicate: (el) => el.props && el.instance,
	},
	{
		hooks: {
			render(inst, cur) {
				if (
					inst.component?.instance?.d?.parentElement?.attributes?.getNamedItem("data-a-target")?.nodeValue !==
					"animated-channel-viewers-count"
				)
					return cur;

				const exists = document.querySelector<HTMLElement>("#seventv-stream-info");
				if (!exists) {
					const siblingEl =
						inst.component?.instance?.d?.parentElement?.parentElement?.parentElement?.parentElement
							?.lastChild;
					if (!siblingEl) return cur;
					const newEl = document.createElement("div");
					newEl.id = "seventv-stream-info";
					siblingEl.insertAdjacentElement("afterend", newEl);
					displayLatency.value = true;
				}
				return cur;
			},
		},
	},
);

onMounted(() => {
	setInterval(() => {
		// Only retrive data for 1 player
		if (mediaPlayerComponent.instances.length === 1) {
			const videoStats = mediaPlayerComponent.instances[0]?.component.getPlayerMetadata();
			videoLatency.value = (videoStats.latencyToBroadcaster / 1000).toFixed(2);
		}
	}, 2000);
});

onUnmounted(() => {
	displayLatency.value = false;
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
}
#seventv-stream-info > figure {
	display: flex !important;
	align-items: center !important;
	justify-content: center !important;
	padding-right: 0.5rem;
}
.seventv-stream-info {
	font-family: Helvetica Neue, sans-serif;
	font-variant-numeric: tabular-nums;
}
</style>
