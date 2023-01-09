<template>
	<div>
		<input
			:id="node.key"
			v-model="setting"
			type="range"
			:min="(node.options?.at(0) as number)"
			:max="(node.options?.at(1) as number)"
			class="slider"
		/>
		{{ setting }}
		{{ node.options?.at(2) }}
	</div>
</template>

<script setup lang="ts">
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	node: SevenTV.SettingNode<number>;
}>();

const setting = useConfig<number>(props.node.key);
</script>
