<template>
	<Tooltip />
</template>

<script setup lang="ts">
import { nextTick, watch } from "vue";
import { useConfig, useSettings } from "@/composable/useSettings";
import useUpdater from "@/composable/useUpdater";
import { useWorker } from "@/composable/useWorker";
import Tooltip from "./Tooltip.vue";
import { useSettingsMenu } from "./settings/Settings";

const { register } = useSettings();
register([
	{
		key: "app.version",
		type: "NONE",
		label: "App Version",
		defaultValue: void 0 as never,
	},
]);

const updater = useUpdater();
const version = useConfig("app.version");
const settingsCtx = useSettingsMenu();

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

		settingsCtx.open = true;

		nextTick(() => stop());
	},
	{ immediate: true },
);
</script>
