<template>
	<Teleport v-if="tray.bodyRef" :to="tray.bodyRef">
		<slot />
	</Teleport>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useTrayRef } from "./ChatTray";

const props = withDefaults(
	defineProps<{
		inputValueOverride?: string;
		sendButtonOverride?: string;
		disableCommands?: boolean;
		disableBits?: boolean;
		disablePaidPinnedChat?: boolean;
		onClose?: (v?: string) => void;
		disableChat?: boolean;
		messageHandler?: (v: string) => void;
		placeholder?: string;
		modifier?: boolean;
	}>(),
	{
		modifier: false,
	},
);

const tray = useTrayRef(props, props.modifier);

onMounted(tray.open);
onUnmounted(tray.close);
</script>
