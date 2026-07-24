<template>
	<template v-for="inst of player.instances" :key="inst.identifier">
		<PlayerController :inst="inst" :media-player="mediaPlayer" />
	</template>

	<template v-if="playerAdvancedOptionsComponent.instances.length > 0">
		<PlayerStreamInfo
			v-if="shouldShowVideoStats"
			ref="info"
			:advanced-controls="playerAdvancedOptionsComponent.instances[0]"
			:media-player="mediaPlayer"
			:latency="latency"
		/>
	</template>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { log } from "@/common/Logger";
import { useComponentHook } from "@/common/ReactHooks";
import { definePropertyHook, unsetPropertyHook } from "@/common/Reflection";
import { declareModule } from "@/composable/useModule";
import { declareConfig, useConfig } from "@/composable/useSettings";
import PlayerController from "./PlayerController.vue";
import PlayerStreamInfo from "./PlayerStreamInfo.vue";

declareModule<"TWITCH">("player", { name: "Player", depends_on: [] });

const mediaPlayer = ref<Twitch.MediaPlayerInstance>();
const latency = ref<string>("-.--");

const shouldShowVideoStats = useConfig<boolean>("player.video_stats");
const autoReloadEnabled = useConfig<boolean>("player.auto_reload.enabled");
const autoReloadThreshold = useConfig<number>("player.auto_reload.threshold");
const info = ref<typeof PlayerStreamInfo | null>(null);

const GRACE_PERIOD_MS = 4000;
const COOLDOWN_MS = 30000;
const STALL_TIMEOUT_MS = 8000;

const STORAGE_KEY = "7tv_player_last_auto_reload";

let overThresholdSince: number | null = null;
let lastReloadAt = Number(sessionStorage.getItem(STORAGE_KEY) ?? 0);
let lastLatencyUpdate = Date.now();
let watchdogInterval: number | undefined;

function triggerReload(reason: string, extra?: unknown) {
	lastReloadAt = Date.now();
	sessionStorage.setItem(STORAGE_KEY, String(lastReloadAt));
	log.info("<Player>", "AUTO-RELOAD TRIGGERED", reason, String(extra ?? ""));
	location.reload();
}

function checkAutoReload(v: number) {
	const now = Date.now();

	if (!autoReloadEnabled.value || !autoReloadThreshold.value || typeof v !== "number") {
		overThresholdSince = null;
		return;
	}
	if (now - lastReloadAt < COOLDOWN_MS) {
		overThresholdSince = null;
		return;
	}
	if (mediaPlayer.value?.isPaused()) {
		overThresholdSince = null;
		return;
	}
	if (v < autoReloadThreshold.value) {
		overThresholdSince = null;
		return;
	}

	if (overThresholdSince === null) {
		overThresholdSince = now;
		return;
	}

	if (now - overThresholdSince >= GRACE_PERIOD_MS) {
		overThresholdSince = null;
		triggerReload("latency threshold", v);
	}
}

function startWatchdog() {
	watchdogInterval = window.setInterval(() => {
		if (!autoReloadEnabled.value) return;
		if (Date.now() - lastLatencyUpdate < STALL_TIMEOUT_MS) return;
		if (Date.now() - lastReloadAt < COOLDOWN_MS) return;
		triggerReload("stall watchdog");
	}, 2000);
}

watch(
	mediaPlayer,
	(mp, old) => {
		if (old && mp !== old) {
			unsetPropertyHook(old.playerInstance.core.state, "liveLatency");
		}
		if (!mp) return;

		definePropertyHook(mp.playerInstance.core.state, "liveLatency", {
			value: (v: number) => {
				latency.value = v?.toFixed(2) ?? "-.--";
				lastLatencyUpdate = Date.now();
				checkAutoReload(v);
			},
		});
	},
	{ immediate: true },
);

onMounted(() => startWatchdog());

onUnmounted(() => {
	if (mediaPlayer.value) {
		unsetPropertyHook(mediaPlayer.value.playerInstance.core.state, "liveLatency");
	}
	if (watchdogInterval) clearInterval(watchdogInterval);
});

const player = useComponentHook<Twitch.VideoPlayerComponent>(
	{
		parentSelector: ".persistent-player",
		predicate: (n) => n.props && n.props.containerRef && n.props.mediaPlayerInstance,
	},
	{
		hooks: {
			render(inst, cur) {
				mediaPlayer.value = inst.component.props.mediaPlayerInstance;
				info.value?.remount?.();
				return cur;
			},
		},
	},
);

const playerAdvancedOptionsComponent = useComponentHook<Twitch.MediaPlayerAdvancedControls>({
	parentSelector: ".persistent-player",
	predicate: (n) => n.props && n.setStatsOverlay && n.setShowControls,
});
</script>
<script lang="ts">
export const config = [
	declareConfig("player.skip_content_restriction", "TOGGLE", {
		label: "Skip Content Warnings",
		hint: "Automatically skip the 'intended for mature audiences' dialog on some streams",
		path: ["Player", ""],
		defaultValue: false,
	}),
	declareConfig("player.video_stats", "TOGGLE", {
		path: ["Player", ""],
		label: "Video Stats",
		hint: "Show Latency to Broadcaster with a tooltip of other video stats",
		defaultValue: false,
	}),
	declareConfig("player.action_onclick", "DROPDOWN", {
		path: ["Player", ""],
		label: "Action on Click",
		hint: "Choose an action to perform when clicking on the video player. (This setting may not work in channels with extensions shown)",
		options: [
			["None", 0],
			["Pause/Unpause", 1],
			["Mute/Unmute", 2],
		],
		defaultValue: 0,
	}),
	declareConfig("player.auto_reload.enabled", "TOGGLE", {
		path: ["Player", ""],
		label: "Auto-reload at high latency",
		hint: "Automatically reloads the stream if the latency to the broadcaster remains above the threshold.",
		defaultValue: false,
	}),
	declareConfig("player.auto_reload.threshold", "SLIDER", {
		path: ["Player", ""],
		label: "Latency Threshold (Seconds)",
		defaultValue: 10,
		options: {
			min: 3,
			max: 60,
			step: 1,
			unit: "s",
		},
	}),
];
</script>
