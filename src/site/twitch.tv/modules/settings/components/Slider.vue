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
		<span v-if="thresoldName" class="thresold-name"> ({{ thresoldName }}) </span>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	node: SevenTV.SettingNode<number, "SLIDER">;
}>();

const setting = useConfig<number>(props.node.key);

const thresoldName = computed(() => {
	if (!props.node.options?.named_thresolds) return;

	const thresolds = props.node.options.named_thresolds;
	let match = 0;
	for (let i = 0; i < thresolds.length; i++) {
		if (setting.value >= thresolds[i][0] && setting.value <= thresolds[i][1]) match = i;
		else continue;
	}

	return thresolds[match][2];
});
</script>

<style scoped lang="scss">
.thresold-name {
	font-size: 0.8em;
	font-weight: 600;
}
</style>
