<template>
	<SettingsMenu />
</template>

<script setup lang="ts">
import { useModule } from "@/composable/useModule";
import { useSettings } from "@/composable/useSettings";
import SettingsMenu from "./SettingsMenu.vue";

const { markAsReady } = useModule("settings", {
	name: "Settings",
	depends_on: [],
});

const { register } = useSettings();

register([
	{
		key: "general.blur_unlisted_emotes",
		label: "Blur unlisted emotes",
		hint: "If checked, emotes which have not yet been approved for listing on 7tv.app will be blurred",
		type: "TOGGLE",
		options: ["Show", "Blur"],
		defaultValue: false,
	},
]);

markAsReady();
</script>
