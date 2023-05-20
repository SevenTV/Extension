<template>
	<div>
		<input id="checkbox" :disabled="disabled" :checked="checked" type="checkbox" @change="onInput" />
	</div>
</template>

<script setup lang="ts">
defineProps<{
	checked: boolean;
	disabled?: boolean;
}>();

const emit = defineEmits<{
	(e: "update:checked", value: boolean): void;
	(e: "update:modelValue", value: boolean): void;
}>();

function onInput(ev: Event): void {
	const checked = (ev.target as HTMLInputElement).checked;

	emit("update:checked", checked);
	emit("update:modelValue", checked);
}
</script>
