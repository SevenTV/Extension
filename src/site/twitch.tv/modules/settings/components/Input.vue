<template>
	<div class="inputbox">
		<input
			:id="node.key"
			v-model="setting"
			type="inputbox"
			:valid="isValid"
			:placeholder="(node.options?.at(0) as string | undefined)"
		/>
	</div>
</template>

<script setup lang="ts">
import { useConfig } from "@/composable/useSettings";
import { computed } from "vue";
const props = defineProps<{
	node: SevenTV.SettingNode<string>;
}>();

const setting = useConfig<string>(props.node.key);

const isValid = computed(() => {
	return props.node.predicate ? props.node.predicate?.(setting.value) : true;
});
</script>

<style scoped lang="scss">
.inputbox > input[valid="false"] {
	background-color: 4px solid #ff000040;
}
</style>
