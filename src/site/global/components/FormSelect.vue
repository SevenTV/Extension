<template>
	<div>
		<template v-for="([option], i) of props.node.options" :key="i">
			<input v-model="setting" class="radio-button" type="text" />
			{{ option }}
			<br />
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	node: SevenTV.SettingNode<string, "SELECT">;
}>();

const setting = useConfig<string>(props.node.key);
const value = ref<unknown>(setting.value);

watch(value, (v) => {
	if (typeof v !== "string") return;

	setting.value = v;
});
</script>
<style scoped lang="scss">
.radio-button {
	margin-right: 1rem;
}
</style>
