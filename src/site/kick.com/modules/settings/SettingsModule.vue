<template>
	<SettingsMenu v-if="ctx.open" />

	<template v-if="chatSettingsPopup">
		<SettingsChatHook :el="chatSettingsPopup" @open-settings="ctx.open = true" />
	</template>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useEventListener } from "@vueuse/core";
import { declareModule } from "@/composable/useModule";
import { useApp } from "@/site/kick.com/composable/useApp";
import { useRouter } from "@/site/kick.com/composable/useRouter";
import SettingsChatHook from "./SettingsChatHook.vue";
import { useSettingsMenu } from "@/app/settings/Settings";
import SettingsMenu from "@/app/settings/SettingsMenu.vue";

declareModule<"KICK">("settings", {
	name: "Settings",
	depends_on: [],
});

const ctx = useSettingsMenu();

// Acquire vue app
const app = useApp();
const router = useRouter(app);

const chatSettingsPopup = ref<HTMLElement | null>(null);

function handle(): void {
	chatSettingsPopup.value = document.querySelector(".chat-actions-popup");
}

watch(() => router.currentRoute, handle, { immediate: true });
useEventListener(document, "click", () => setTimeout(handle, 0), {
	capture: true,
});
</script>
