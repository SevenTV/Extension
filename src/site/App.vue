<template>
	<!-- Spawn Platform-specific Logic -->
	<template v-if="!wg">
		<Suspense>
			<component :is="platformComponent" v-if="platformComponent" />
		</Suspense>

		<div id="seventv-emoji-container" :style="{ display: 'none' }">
			<component :is="EmojiContainer" />
		</div>
	</template>

	<!-- Render tooltip -->
	<Teleport to="#root, body">
		<Global v-if="!wg" />
	</Teleport>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import { defineAsyncComponent } from "vue";
import { inject } from "vue";
import { markRaw, onMounted, ref } from "vue";
import { APP_BROADCAST_CHANNEL, SITE_WORKER_URL } from "@/common/Constant";
import { log } from "@/common/Logger";
import { db } from "@/db/idb";
import { fillSettings, useConfig, useSettings } from "@/composable/useSettings";
import { useWorker } from "@/composable/useWorker";
import Global from "./global/Global.vue";
import YouTubeSite from "./youtube.com/YouTubeSite.vue";

const EmojiContainer = defineAsyncComponent(() => import("@/site/EmojiContainer.vue"));
const TwitchSite = defineAsyncComponent(() => import("@/site/twitch.tv/TwitchSite.vue"));

if (import.meta.hot) {
	import.meta.hot.on("full-reload", () => {
		log.info("Full reload triggered by vite server");
		window.location.reload();
	});
}

const wg = ref(3);
const appID = inject<string>("app-id") ?? null;
const settings = useSettings();
log.info(`7TV (inst: ${appID}) is loading`);

// Detect current platform
const domain = window.location.hostname.split(/\./).slice(-2).join(".");
const platformComponent = ref<Component>();

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
const netChannel = new BroadcastChannel("SEVENTV#NETWORK");
const { init, target } = useWorker();
init(netChannel, inject(SITE_WORKER_URL, ""));

target.addEventListener("ready", () => {
	log.info("Worker ready");
	wg.value--;
});

const bc = new BroadcastChannel(APP_BROADCAST_CHANNEL);
bc.addEventListener("message", (ev) => {
	if (ev.data.type !== "seventv-settings-sync") return;
	const { nodes } = ev.data.data as { nodes: (SevenTV.Setting<SevenTV.SettingNode> & { timestamp: number })[] };

	const newNodes = nodes.filter(
		(n) => !settings.nodes[n.key] || n.timestamp > (settings.nodes[n.key].timestamp ?? 0),
	);

	for (const node of newNodes) {
		useConfig(node.key).value = node.value;
	}
});

log.setContextName(`site/${domain}`);

onMounted(() => {
	// Define site controller for the platform
	platformComponent.value = {
		"twitch.tv": markRaw(TwitchSite),
		"youtube.com": markRaw(YouTubeSite),
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
