<template>
	<div class="alias-button" :shrink="!active">
		<input
			ref="aliasRef"
			:value="alias"
			:active="active"
			:placeholder="active ? 'Alias' : '...'"
			@input="emit('update:alias', aliasRef!.value)"
			@focus="active = true"
			@blur="if (alias === '') active = false;"
		/>
	</div>
</template>
<script setup lang="ts">
import { ref } from "vue";

defineProps<{
	alias: string;
}>();

const emit = defineEmits<{
	(event: "update:alias", value: string): void;
}>();
const active = ref(false);
const aliasRef = ref<HTMLInputElement>();
</script>

<style scoped lang="scss">
[invalid="true"] {
	input {
		border-color: red !important;
		outline-color: red !important;
	}
}
.alias-button {
	height: 3rem;
	max-width: 6rem;
	display: flex;
	align-items: center;
	justify-content: end;
	flex-grow: 1;

	input {
		width: 3rem;
		height: 3rem;
		padding: 0.5rem;
		color: var(--color-text-base);
		box-sizing: border-box;

		transition: width 0.2s;

		border: 0.1rem solid transparent;
		border-radius: 0.5rem;
		background-color: var(--color-background-input);

		&[active="true"] {
			width: 100%;
			border-color: var(--color-border-base);
		}

		&[active="false"] {
			text-align: center;
			cursor: pointer;

			&:hover {
				background-color: var(--color-background-button-text-hover);
			}
		}
	}
}
</style>
