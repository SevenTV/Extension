<template>
	<SettingsMenu />
	<SettingsMenuButton @toggle="ctx.open = !ctx.open" />
</template>

<script setup lang="ts">
import { declareModule } from "@/composable/useModule";
import { useSettingsMenu } from "@/site/global/settings/Settings";
import SettingsMenuButton from "./SettingsMenuButton.vue";
import SettingsMenu from "../../../global/settings/SettingsMenu.vue";
import { declareConfig } from "@/composable/useSettings";

const { markAsReady } = declareModule("settings", {
	name: "Settings",
	depends_on: [],
});

const ctx = useSettingsMenu();

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("ui.transparent_backgrounds", "TOGGLE", {
		path: ["Appearance", "Interface"],
		label: "Use UI transparency",
		hint: "If checked some backgrounds will be transparent and blurred. This may affect performance",
		defaultValue: true,
	}),
];
</script>
