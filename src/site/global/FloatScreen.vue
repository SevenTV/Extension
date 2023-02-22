<template>
	<UiFloating
		v-if="screen.anchor"
		:anchor="screen.anchor"
		:placement="screen.placement"
		:middleware="screen.middleware"
	>
		<div ref="teleportContainer" class="seventv-float-screen" />
	</UiFloating>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { FloatScreen } from "@/composable/useFloatContext";
import UiFloating from "@/ui/UiFloating.vue";

const props = defineProps<{
	screen: FloatScreen;
}>();

const emit = defineEmits<{
	(e: "container-created", sym: symbol, container: Element): void;
}>();

const teleportContainer = ref<HTMLElement>();

watch(teleportContainer, (container) => {
	if (!container) return;

	emit("container-created", props.screen.sym, container);
});
</script>
