<template>
	<input v-model.lazy="setting" :id="node.key" type="color" :valid="isValid" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	node: SevenTV.SettingNode<string, "COLOR">;
}>();

const setting = useConfig<string>(props.node.key);

const isValid = computed(() => {
	return props.node.predicate ? props.node.predicate?.(setting.value) : true;
});
</script>
