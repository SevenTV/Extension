<template>
	<div class="inputbox">
		<input
			:id="node.key"
			v-model="setting"
			:valid="isValid"
			:placeholder="node.options?.placeholder"
			:type="node.options?.type ?? 'inputbox'"
			@input="(i) => (isValid = node.predicate ? node.predicate((i.target as HTMLInputElement).value) : true)"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	node: SevenTV.SettingNode<string, "INPUT">;
}>();

const setting = useConfig<string>(props.node.key);
const isValid = ref(true);
</script>

<style scoped lang="scss">
.inputbox {
	background-color: currentcolor;

	input[valid="false"] {
		outline-color: red !important;
		background-color: #f004;
	}
}
</style>
