<template>
	<select :id="node.key" v-model="setting">
		<option v-for="([option, value], i) of node.options" :key="i" :value="value ?? option">
			{{ option }}
		</option>
	</select>
</template>

<script setup lang="ts">
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	node: SevenTV.SettingNode<SevenTV.SettingType, "DROPDOWN">;
}>();

const setting = useConfig(props.node.key);
</script>

<style scoped lang="scss">
select {
	background-color: var(--seventv-input-background);
	padding: 0.5rem 1rem;
	border-radius: 0.25rem;
	border: 0.01rem solid var(--seventv-input-border);
	color: var(--seventv-text-color-normal);
}
</style>
