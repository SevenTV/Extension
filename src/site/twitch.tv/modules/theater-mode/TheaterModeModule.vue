<template />

<script setup lang="ts">
import { inject, ref, watch } from "vue";
import { watchDebounced } from "@vueuse/shared";
import { SITE_NAV_PATHNAME } from "@/common/Constant";
import { declareModule } from "@/composable/useModule";
import { declareConfig, useConfig } from "@/composable/useSettings";

const { markAsReady } = declareModule("theater-mode", {
	name: "Theater Mode",
	depends_on: ["settings"],
});

const autoTheaterMode = useConfig<boolean>("ui.auto_theater_mode");
const pathname = inject(SITE_NAV_PATHNAME) ?? ref("");

function enterTheaterMode() {
	if (!autoTheaterMode.value) return;

	const btn = document.querySelector<HTMLElement>("[aria-label='Theatre Mode (alt+t)']");
	if (!btn) return;

	btn.click();
}

watchDebounced(pathname, enterTheaterMode, { debounce: 1000, immediate: true });

watch(autoTheaterMode, (enabled) => {
	if (!enabled) return;
	enterTheaterMode();
});

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("ui.auto_theater_mode", "TOGGLE", {
		path: ["Appearance", "Interface"],
		label: "Auto Theater Mode",
		hint: "Automatically enter theater mode when opening a stream.",
		defaultValue: false,
	}),
];
</script>
