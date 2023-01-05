<template>
	<SettingsMenu />
</template>

<script setup lang="ts">
import { useModule } from "@/composable/useModule";
import SettingsMenu from "./SettingsMenu.vue";

const { markAsReady } = useModule("settings", {
	name: "Settings",
	depends_on: [],
});

markAsReady();
</script>
