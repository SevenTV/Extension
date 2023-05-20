<template>
	<div class="seventv-toggle-outer">
		<span v-if="node.options?.left" class="seventv-toggle-option">
			{{ node.options.left }}
		</span>
		<label class="seventv-toggle-switch" :for="node.key">
			<input :id="node.key" v-model="setting" type="checkbox" />
			<div class="seventv-toggle round"></div>
		</label>
		<span v-if="node.options?.right" class="seventv-toggle-option">
			{{ node.options.right }}
		</span>
	</div>
</template>

<script setup lang="ts">
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	node: SevenTV.SettingNode<boolean, "TOGGLE">;
}>();

const setting = useConfig<boolean>(props.node.key);
</script>

<style scoped lang="scss">
@import "@/assets/style/shape";

.seventv-toggle-outer {
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 1rem;
}

.seventv-toggle-option {
	font-size: 1.4rem;
	font-weight: 600;
	vertical-align: center;
}

.seventv-toggle-switch {
	display: inline-block;
	height: 2rem;
	position: relative;
	width: 4rem;
}

.seventv-toggle-switch input {
	display: none;
}

.seventv-toggle {
	background-color: var(--seventv-input-background);
	inset: 0;
	cursor: pointer;
	position: absolute;
	transition: 0.25s;
	outline: 0.01rem solid var(--seventv-input-border);
}

.seventv-toggle::before {
	background-color: var(--seventv-input-border);
	bottom: 0.3rem;
	content: "";
	height: 1.4rem;
	left: 0.3rem;
	position: absolute;
	transition: 0.25s;
	width: 1.4rem;
}

input:checked + .seventv-toggle::before {
	background-color: var(--seventv-primary);
	transform: translateX(2rem);
}

.seventv-toggle.round {
	border-radius: 0.25rem;
}

.seventv-toggle.round::before {
	border-radius: 0.25rem;
}
</style>
