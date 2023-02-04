<template>
	<Suspense>
		<component :is="mod" ref="modRef" />
	</Suspense>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

defineProps<{
	mod: unknown;
}>();

const emit = defineEmits<{
	(e: "mounted", inst: InstanceType<ComponentFactory>): void;
}>();

const modRef = ref();

onMounted(() => {
	emit("mounted", modRef.value);
});
</script>
