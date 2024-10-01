<template>
	<Tooltip />
	<FloatContext />
	<Transition name="settings-menu" appear>
		<SettingsMenu v-if="settingsMenuCtx.open" />
	</Transition>
</template>

<script setup lang="ts">
import { nextTick, watch } from "vue";
import { useConfig, useSettings } from "@/composable/useSettings";
import useUpdater from "@/composable/useUpdater";
import { useWorker } from "@/composable/useWorker";
import FloatContext from "./FloatContext.vue";
import { dataSettings, globalSettings } from "./GlobalSettings";
import Tooltip from "./Tooltip.vue";
import { useSettingsMenu } from "@/app/settings/Settings";
import SettingsMenu from "@/app/settings/SettingsMenu.vue";

const settingsMenuCtx = useSettingsMenu();

const { register } = useSettings();

register(dataSettings);
register(globalSettings);

const html = document.documentElement.classList;
const body = document.body.classList;
const useTransparency = useConfig("ui.transparent_backgrounds");

watch(
	useTransparency,
	() => {
		if (useTransparency.value) {
			html.add("seventv-transparent");
			body.add("seventv-transparent");
		} else {
			html.remove("seventv-transparent");
			body.remove("seventv-transparent");
		}
	},
	{ immediate: true },
);

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
