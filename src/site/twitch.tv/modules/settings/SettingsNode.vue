<template>
	<div class="settings-node">
		<div class="label">
			{{ node.label }}
		</div>
		<div class="component-container">
			<component :is="getComponent(node)" :node="node" />
			<div v-if="node.hint" class="hint">
				{{ node.hint }}
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { getComponent } from "./components";

defineProps<{
	node: SevenTV.SettingNode<SevenTV.SettingType>;
}>();
</script>

<style scoped lang="scss">
.settings-node {
	display: flex;
	margin: 2rem;
}

.label {
	font-size: 1.4rem;
	font-weight: 600;
	width: 26%;
	margin-right: 4%;
}

.component-container {
	width: 70%;
}

.hint {
	margin-top: 1rem;
	font-size: 1.2rem;
	font-weight: 400;
}
</style>
