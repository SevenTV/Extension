<template>
	<div>
		<input :id="node.key" v-model="setting" type="color" />
	</div>
</template>

<script setup lang="ts">
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	node: SevenTV.SettingNode<string, "COLOR">;
}>();

const setting = useConfig<string>(props.node.key);
</script>

<style scoped lang="scss">
input {
	&::-webkit-color-swatch-wrapper {
		padding: 0;
	}

	&::-webkit-color-swatch {
		border: none;
	}
}
</style>
