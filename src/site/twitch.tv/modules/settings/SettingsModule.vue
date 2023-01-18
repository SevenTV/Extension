<template>
	<SettingsMenu />
</template>

<script setup lang="ts">
import { declareModule } from "@/composable/useModule";
import SettingsMenu from "./SettingsMenu.vue";

const { markAsReady } = declareModule("settings", {
	name: "Settings",
	depends_on: [],
});

markAsReady();
</script>
