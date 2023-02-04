<template>
	<!-- Spawn Platform-specific Logic -->
	<template v-if="!wg">
		<component :is="platformComponent" v-if="platformComponent" />

		<div id="seventv-emoji-container" :style="{ display: 'none' }">
			<component :is="EmojiContainer" />
		</div>
	</template>

	<!-- Render tooltip -->
	<Teleport to="#root">
		<Global v-if="!wg" />
	</Teleport>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import { defineAsyncComponent } from "vue";
import { inject } from "vue";
import { markRaw, onMounted, ref } from "vue";
import { log } from "@/common/Logger";
import { db } from "@/db/idb";
import { fillSettings } from "@/composable/useSettings";
import { useWorker } from "@/composable/useWorker";
import Global from "./global/Global.vue";
import TwitchSite from "./twitch.tv/TwitchSite.vue";

if (import.meta.hot) {
	import.meta.hot.on("full-reload", () => {
		log.info("Full reload triggered by vite server");
		window.location.reload();
	});
}

const wg = ref(3);
const appID = inject<string>("app-id") ?? null;

const EmojiContainer = defineAsyncComponent(() => import("@/site/EmojiContainer.vue"));

log.info(`7TV (inst: ${appID}) is loading`);

db.ready().then(async () => {
	log.info("IndexedDB ready");

	db.settings
		.toArray()
		.then((s) => {
			fillSettings(s);

			wg.value--;
			log.info("User Settings loaded");
		})
		.catch((err) => log.error("failed to fetch settings", err.message));

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

onMounted(() => {
	// Define site controller for the platform
	platformComponent.value = {
		"twitch.tv": markRaw(TwitchSite),
	}[domain];
});
</script>

<style lang="scss">
@import "@/assets/style/global.scss";

#seventv-emoji-container {
	position: fixed;
	top: -1px;
	left: -1px;
	display: none;
}
</style>
