<template>
	<Transition name="settings-menu" appear>
		<SettingsMenu v-if="ctx.open" />
	</Transition>

	<SettingsMenuButton @toggle="ctx.open = !ctx.open" />
</template>

<script setup lang="ts">
import { declareModule } from "@/composable/useModule";
import { useSettingsMenu } from "@/app/settings/Settings";
import SettingsMenuButton from "./SettingsMenuButton.vue";
import SettingsMenu from "../../../../app/settings/SettingsMenu.vue";
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

<style scoped lang="scss">
.settings-menu-enter-active,
.settings-menu-leave-active {
	transition: opacity 120ms;
}

.settings-menu-enter-from,
.settings-menu-leave-to {
	opacity: 0;
}
</style>
