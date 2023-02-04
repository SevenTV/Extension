<template>
	<div v-if="isEnabled" class="seventv-tw-button seventv-mod-logs-button" @click="onClick">
		<button>
			<ModLogsIcon class="icon" />
		</button>
		<span class="tooltip-over">Mod Logs</span>
	</div>
</template>

<script setup lang="ts">
import { useConfig } from "@/composable/useSettings";
import ModLogsIcon from "@/assets/svg/icons/ModLogsIcon.vue";

defineProps<{
	onClick: () => void;
}>();

const isEnabled = useConfig<boolean>("chat.mod_logs.enabled");
</script>

<style scoped lang="scss">
@import "@/assets/style/tw-tooltip.scss";
</style>
