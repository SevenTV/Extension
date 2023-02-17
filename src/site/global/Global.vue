<template>
	<Tooltip />
</template>

<script setup lang="ts">
import { nextTick, watch } from "vue";
import { useConfig, useSettings } from "@/composable/useSettings";
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

const runtimeVersion = import.meta.env.VITE_APP_VERSION;
const version = useConfig("app.version");
const settingsCtx = useSettingsMenu();

const stop = watch(
	version,
	(v) => {
		if (version.value === null || runtimeVersion === v) return;

		version.value = runtimeVersion;

		settingsCtx.open = true;

		nextTick(() => stop());
	},
	{ immediate: true },
);
</script>
