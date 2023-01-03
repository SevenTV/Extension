<template>
	<select :id="node.key" v-model="setting">
		<option v-for="(option, i) of node.options" :key="i" :value="option">
			{{ option }}
		</option>
	</select>
</template>

<script setup lang="ts">
import { useConfig } from "@/composable/useSettings";
const props = defineProps<{
	node: SevenTV.SettingNode<SevenTV.SettingType>;
}>();

const setting = useConfig(props.node.key);
</script>
