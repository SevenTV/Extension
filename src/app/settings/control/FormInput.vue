<template>
	<div class="inputbox">
		<input
			:id="node.key"
			v-model="temp"
			:valid="isValid"
			:placeholder="node.options?.placeholder"
			:type="node.options?.type ?? 'inputbox'"
			@input="onInput"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	node: SevenTV.SettingNode<string, "INPUT">;
}>();

const setting = useConfig<string>(props.node.key);
const temp = ref(setting.value);
const isValid = ref(true);

watch(setting, (v) => (temp.value = v));

const onInput = () => {
	isValid.value = props.node.predicate ? props.node.predicate(temp.value) : true;
	if (isValid.value) setting.value = temp.value;
};
</script>

<style scoped lang="scss">
input {
	background-color: var(--seventv-input-background);
	padding: 0.5rem 1rem;
	border-radius: 0.25rem;
	border: 0.01rem solid var(--seventv-input-border);
	color: var(--seventv-text-color-normal);

	&[valid="false"] {
		outline-color: red !important;
		background-color: #f004;
	}
}
</style>
