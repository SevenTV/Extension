<template>
	<input
		ref="inputEl"
		:type="type"
		autocomplete="off"
		:error="error"
		:autofocus="autofocus"
		:value="modelValue"
		:placeholder="label"
		@input="onInput"
		@blur="emit('blur')"
	/>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const props = withDefaults(
	defineProps<{
		label?: string;
		modelValue?: string | number;
		type?: "text" | "password" | "email" | "number" | "url";
		icon?: string;
		error?: boolean;
		width?: string;
		appearance?: "flat" | "outline";
		autofocus?: boolean;
	}>(),
	{
		type: "text",
		appearance: "outline",
	},
);

const emit = defineEmits<{
	(e: "update:modelValue", value: string | number): void;
	(e: "blur"): void;
}>();

const onInput = (event: Event) => emit("update:modelValue", (event.target as HTMLInputElement).value);

const inputEl = ref<HTMLInputElement | null>(null);

defineExpose({
	focus: () => inputEl.value?.focus(),
});

onMounted(() => {
	if (inputEl.value && props.autofocus) {
		inputEl.value.focus();
	}
});
</script>

<style scoped lang="scss">
input {
	all: unset;
	width: v-bind(width);
	transition: border-color 140ms ease-in-out;
	background-color: transparent;
	border-bottom: 0.1rem solid var(--seventv-input-border);
	color: inherit;
	padding: 0.5rem;
	font-size: 1em;
	font-weight: 500;

	&:focus {
		outline: unset;
		border-color: var(--seventv-primary);

		& ~ label {
			font-weight: 600;
			transform: translateY(-1.35em) translateX(-0.25em) scale(0.8);
		}
	}
}
</style>
