<template>
	<!-- Spawn Platform-specific Logic -->
	<template v-if="!wg">
		<component :is="platformComponent" v-if="platformComponent" />
	</template>

	<!-- Render tooltip -->
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
</template>

<script setup lang="ts">
import { Component, markRaw, onMounted, ref } from "vue";
import { log } from "@/common/Logger";
import { tooltip } from "@/composable/useTooltip";
import { useWorker } from "@/composable/useWorker";
import TwitchSite from "./twitch.tv/TwitchSite.vue";
import { db } from "@/db/idb";

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
#seventv-root {
	z-index: 1;
}

#seventv-tooltip-container {
	all: unset;
	z-index: 999;
	position: absolute;
	pointer-events: none;
	top: 0;
	left: 0;
}

.tw-root--theme-dark {
	--seventv-background-transparent-1: #161616c4;
	--seventv-border-transparent-1: #ffffff1a;
}

.tw-root--theme-light {
	--seventv-background-transparent-1: #e9e9e9c4;
	--seventv-border-transparent-1: #0000001a;
}
</style>
