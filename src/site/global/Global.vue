<template>
	<Tooltip />
	<FloatContext />
</template>

<script setup lang="ts">
import { nextTick, watch } from "vue";
import { useConfig, useSettings } from "@/composable/useSettings";
import useUpdater from "@/composable/useUpdater";
import { useWorker } from "@/composable/useWorker";
import FloatContext from "./FloatContext.vue";
import Tooltip from "./Tooltip.vue";

const { register } = useSettings();
register([
	{
		key: "app.version",
		type: "NONE",
		label: "App Version",
		defaultValue: void 0 as never,
	},
	{
		key: "app.7tv.token",
		type: "NONE",
		label: "7TV Bearer Token",
		expires: 0,
		defaultValue: "",
	},
]);

const updater = useUpdater();
const version = useConfig("app.version");

const { target } = useWorker();
target.addEventListener("config", (cfg) => {
	const { version } = cfg.detail;
	if (!version) return;

	updater.latestVersion = version;

	// check for updates
	updater.checkUpdate();
});

const stop = watch(
	version,
	(v) => {
		if (version.value === null || updater.runtimeVersion === v) return;

		version.value = updater.runtimeVersion;

		nextTick(() => stop());
	},
	{ immediate: true },
);
</script>
