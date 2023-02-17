<template>
	<div class="toggle-outer">
		<span v-if="node.options?.left" class="slider-option">
			{{ node.options.left }}
		</span>
		<label class="switch" :for="node.key">
			<input :id="node.key" v-model="setting" type="checkbox" />
			<div class="slider round"></div>
		</label>
		<span v-if="node.options?.right" class="slider-option">
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
@import "@/assets/style/shape.scss";

.toggle-outer {
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 1rem;
}
.slider-option {
	font-size: 1.4rem;
	font-weight: 600;
	vertical-align: center;
}
.switch {
	display: inline-block;
	height: 2rem;
	position: relative;
	width: 4rem;
}

.switch input {
	display: none;
}

.slider {
	background-color: #ccc;
	bottom: 0;
	cursor: pointer;
	left: 0;
	position: absolute;
	right: 0;
	top: 0;
	transition: 0.25s;
}

.slider:before {
	background-color: #fff;
	bottom: 0.3rem;
	content: "";
	height: 1.4rem;
	left: 0.3rem;
	position: absolute;
	transition: 0.25s;
	width: 1.4rem;
	transform: rotate(-45deg);
}

input:checked + .slider {
	background-color: #66bb6a;
}

input:checked + .slider:before {
	transform: translateX(2rem) rotate(45deg);
}

.slider.round {
	clip-path: create-bevel(0.33rem);
}

.slider.round:before {
	clip-path: create-bevel(0.5rem);
}
</style>
