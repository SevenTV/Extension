<template>
	<div class="seventv-slider-container">
		<span>{{ valueName }}</span>
		<div class="seventv-slider" :class="{ 'show-thresold-name': !!thresoldName }" :thresold-name="thresoldName">
			<input
				:id="node.key"
				v-model.number="setting"
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
	return findThreshold(setting.value, props.node.options?.named_thresolds);
});

const valueName = computed(() => {
	const name = findThreshold(setting.value, props.node.options?.named_values);

	return name ?? `${setting.value}${props.node.options?.unit ? ` ${props.node.options.unit}` : ""}`;
});

function findThreshold(value: number, thresholds?: [number, number, string][]) {
	if (!thresholds) return;

	for (let i = 0; i < thresholds.length; i++) {
		if (value >= thresholds[i][0] && value <= thresholds[i][1]) {
			return thresholds[i][2];
		}
	}
}
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

.seventv-slider {
	height: 0.75rem;
	background: var(--seventv-input-background);
	outline: 0.01rem solid var(--seventv-input-border);
	width: fit-content;
	align-items: center;
	border-radius: 0.15rem;
	display: inline-flex;

	&.show-thresold-name::after {
		content: attr(thresold-name);
		position: relative;
		width: 0;
		height: 1rem;
		top: 2rem;
		right: calc(100% - 0.5rem);
		font-size: 1rem;
		font-weight: 600;
		font-style: italic;
	}

	> input {
		appearance: none;
		background: transparent;

		&[held="true"] {
			&::-webkit-slider-thumb {
				transform: scale(1.15);
			}

			&::-moz-range-thumb {
				transform: scale(1.15);
			}
		}
	}

	@mixin thumb {
		transition: transform 70ms ease;
		appearance: none;
		background-color: var(--seventv-primary);
		clip-path: circle(1rem at center);
		border-radius: 0.25rem;
		height: 1.5rem;
		width: 1.5rem;
		z-index: 100;

		&:hover {
			cursor: pointer;
		}
	}

	> input::-webkit-slider-thumb {
		@include thumb;
	}

	> input::-moz-range-thumb {
		@include thumb;
	}

	> input::-webkit-slider-runnable-track {
		appearance: none;
		cursor: pointer;
	}

	> input::-moz-range-track {
		appearance: none;
		cursor: pointer;
	}
}
</style>
