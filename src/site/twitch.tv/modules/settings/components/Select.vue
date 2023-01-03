<template>
	<div>
		<template v-for="(option, i) of props.node.options" :key="i">
			<input v-model="setting" class="radio-button" type="radio" :value="option" />
			{{ option }}
			<br />
		</template>
	</div>
</template>

<script setup lang="ts">
import { useConfig } from "@/composable/useSettings";
const props = defineProps<{
	node: SevenTV.SettingNode<string>;
}>();

const setting = useConfig<string>(props.node.key);
</script>
<style scoped lang="scss">
.radio-button {
	margin-right: 1rem;
}
</style>
