<template>
	<div>
		<input
			:id="node.key"
			v-model="setting"
			type="range"
			:min="node.options?.min"
			:max="node.options?.max"
			:step="node.options?.step"
			class="slider"
		/>
		{{ setting }}
		{{ node.options?.unit }}
	</div>
</template>

<script setup lang="ts">
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	node: SevenTV.SettingNode<number, "SLIDER">;
}>();

const setting = useConfig<number>(props.node.key);
</script>
