<template>
	<Suspense>
		<component :is="mod" ref="modRef" />
	</Suspense>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

defineProps<{
	mod: unknown;
}>();

const emit = defineEmits<{
	(e: "mounted", inst: InstanceType<ComponentFactory>): void;
}>();

let mounted = false;

const modRef = ref();

watch(
	modRef,
	(val) => {
		if (!mounted && val) {
			emit("mounted", val);
			mounted = true;
		}
	},
	{ immediate: true },
);
</script>
