<template>
	<Tooltip />
	<Changelog v-if="showChangelog" @close="showChangelog = false" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useConfig, useSettings } from "@/composable/useSettings";
import Changelog from "./Changelog.vue";
import Tooltip from "./Tooltip.vue";

const showChangelog = ref(false);

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

watch(
	version,
	(v) => {
		if (version.value === null || runtimeVersion === v) return;

		version.value = runtimeVersion;
		showChangelog.value = true;
	},
	{ immediate: true },
);
</script>
