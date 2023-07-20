<template>
	<div>
		<input id="checkbox" v-model="setting" type="checkbox" />
	</div>
</template>

<script setup lang="ts">
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	node: SevenTV.SettingNode<boolean>;
}>();

const setting = useConfig<boolean>(props.node.key);
</script>
