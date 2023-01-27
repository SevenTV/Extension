<template>
	<SettingsMenu />
</template>

<script setup lang="ts">
import { declareModule } from "@/composable/useModule";
import { Area } from "./SettingNames";
import SettingsMenu from "./SettingsMenu.vue";

defineExpose({
	toggle: undefined as (() => void) | undefined,
	setArea: undefined as ((v: Area) => void) | undefined,
	setFrontpageArea: undefined as (() => void) | undefined,
	setSettingsArea: undefined as ((c: string, s: string) => void) | undefined,
	setProfileArea: undefined as (() => void) | undefined,
});

const { markAsReady } = declareModule("settings", {
	name: "Settings",
	depends_on: [],
	config: [
		{
			key: "app.seventv_bearer_token",
			label: "Auth token",
			type: "NONE",
			value: "",
			defaultValue: "",
		},
		{
			key: "ui.transparent_backgrounds",
			path: ["Appearance", "Interface"],
			label: "Use UI transparency",
			hint: "If checked some backgrounds will be transparent and blurred. This may affect performance",
			type: "TOGGLE",
			defaultValue: true,
		},
	],
});

markAsReady();
</script>
