<template>
	<SettingsMenuButton @toggle="ctx.open = !ctx.open" />
</template>

<script setup lang="ts">
import { declareModule } from "@/composable/useModule";
import SettingsMenuButton from "./SettingsMenuButton.vue";
import { useSettingsMenu } from "@/app/settings/Settings";

const { markAsReady } = declareModule("settings", {
	name: "Settings",
	depends_on: [],
});

const ctx = useSettingsMenu();

markAsReady();
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
