<template>
	<SettingsMenu />
	<SettingsMenuButton @toggle="ctx.open = !ctx.open" />
</template>

<script setup lang="ts">
import { declareModule } from "@/composable/useModule";
import { useSettingsMenu } from "@/site/global/settings/Settings";
import SettingsMenuButton from "./SettingsMenuButton.vue";
import SettingsMenu from "../../../global/settings/SettingsMenu.vue";

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

const ctx = useSettingsMenu();

markAsReady();
</script>
