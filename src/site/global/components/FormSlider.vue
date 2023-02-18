<template>
	<div class="seventv-slider-container">
		<span> {{ setting }} {{ node.options?.unit }} </span>
		<div class="seventv-slider">
			<input
				:id="node.key"
				v-model="setting"
				type="range"
				:min="node.options?.min"
				:max="node.options?.max"
				:step="node.options?.step"
				:held="held"
				@mousedown="held = true"
				@mouseup="held = false"
			/>
		</div>
	</div>
	<span v-if="thresoldName" class="seventv-slider-thresold-name"> ({{ thresoldName }}) </span>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	node: SevenTV.SettingNode<number, "SLIDER">;
}>();

const held = ref(false);
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
.seventv-slider-container {
	display: flex;
	align-items: center;
	column-gap: 1rem;
	justify-content: space-between;

	> input {
		cursor: pointer;
	}
}

.seventv-slider-thresold-name {
	display: flex;
	align-items: center;
	float: right;
	font-size: 0.85rem;
	font-weight: 600;
	font-style: italic;
}

.seventv-slider {
	height: 0.75rem;
	background: var(--seventv-input-background);
	outline: 0.01rem solid var(--seventv-input-border);
	width: fit-content;
	align-items: center;
	border-radius: 0.15rem;
	display: inline-flex;

	> input {
		-webkit-appearance: none;
		appearance: none;
		background: transparent;

		&[held="true"]::-webkit-slider-thumb {
			transform: scale(1.15);
		}
	}

	> input::-webkit-slider-thumb {
		-webkit-appearance: none;
		transition: transform 70ms ease;
		appearance: none;
		background-color: var(--seventv-accent);
		clip-path: circle(1rem at center);
		border-radius: 0.25rem;
		height: 1.5rem;
		width: 1.5rem;
		z-index: 100;
	}

	> input::-webkit-slider-runnable-track {
		-webkit-appearance: none;
		appearance: none;
		cursor: pointer;
	}
}
</style>
