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
