<template>
	<div
		id="seventv-tooltip-container"
		ref="tooltipContainer"
		:active="!!tooltip.content"
		:style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
	>
		<template v-if="typeof tooltip.content === 'string'">
			<span class="text-only-tooltip">{{ tooltip.content }}</span>
		</template>
		<template v-else>
			<component :is="tooltip.content" v-bind="tooltip.contentProps" />
		</template>
		<div id="seventv-tooltip-arrow" ref="arrowEl" />
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { tooltip } from "@/composable/useTooltip";

// Tooltip positioning data
const tooltipContainer = ref<HTMLDivElement | null>(null);
const arrowEl = ref<HTMLDivElement | null>(null);

onMounted(() => {
	if (tooltipContainer.value) {
		tooltip.container = tooltipContainer.value;
	}
});
</script>

<style scoped lang="scss">
#seventv-tooltip-container {
	all: unset;
	display: grid;
	z-index: 99999;
	position: absolute;
	pointer-events: none;
	top: 0;
	left: 0;
	background-color: var(--seventv-background-transparent-2);

	@at-root .seventv-transparent & {
		backdrop-filter: blur(0.88em);
	}
	border-radius: 0.25em;

	&[active="true"] {
		outline: 0.1em solid var(--seventv-border-transparent-1);
	}

	.text-only-tooltip {
		padding: 0.25em;
	}
}

#seventv-tooltip-arrow {
	position: absolute;
}
</style>
