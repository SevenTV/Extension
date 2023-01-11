<template>
	<!-- Spawn Platform-specific Logic -->
	<template v-if="!wg">
		<component :is="platformComponent" v-if="platformComponent" />
	</template>

	<!-- Render tooltip -->
	<Teleport to="#root">
		<div
			id="seventv-tooltip-container"
			ref="tooltipContainer"
			:style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
		>
			<template v-if="typeof tooltip.content === 'string'">
				{{ tooltip.content }}
			</template>
			<template v-else>
				<component :is="tooltip.content" v-bind="tooltip.contentProps" />
			</template>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import { markRaw, onMounted, ref } from "vue";
import { log } from "@/common/Logger";
import { tooltip } from "@/composable/useTooltip";
import { useWorker } from "@/composable/useWorker";
import TwitchSite from "./twitch.tv/TwitchSite.vue";
import { db } from "@/db/idb";

if (import.meta.hot) {
	import.meta.hot.on("full-reload", () => {
		log.info("Full reload triggered by vite server");
		window.location.reload();
	});
}

const wg = ref(2);

log.info("7TV is loading");

db.ready().then(() => {
	log.info("IndexedDB ready");
	wg.value--;
});

// Spawn SharedWorker
const bc = new BroadcastChannel("SEVENTV#NETWORK");
const { init, target } = useWorker();
init(bc);

target.addEventListener("ready", () => {
	log.info("Worker ready");
	wg.value--;
});

// Detect current platform
const domain = window.location.hostname.split(/\./).slice(-2).join(".");

const platformComponent = ref<Component>();

log.setContextName(`site/${domain}`);

// Tooltip positioning data
const tooltipContainer = ref<HTMLDivElement | null>(null);

onMounted(() => {
	if (tooltipContainer.value) {
		tooltip.container = tooltipContainer.value;
	}

	// Define site controller for the platform
	platformComponent.value = {
		"twitch.tv": markRaw(TwitchSite),
	}[domain];
});
</script>

<style lang="scss">
@import "@/assets/style/global.scss";
</style>
