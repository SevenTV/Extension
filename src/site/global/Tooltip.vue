<template>
	<div
		id="seventv-tooltip-container"
		ref="tooltipContainer"
		:style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
	>
		<template v-if="typeof tooltip.content === 'string'">
			{{ tooltip.content }}
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
	z-index: 99999;
	position: absolute;
	pointer-events: none;
	top: 0;
	left: 0;
	background-color: var(--seventv-background-transparent-2);
	backdrop-filter: blur(0.88em);
	outline: 0.1em solid var(--seventv-border-transparent-1);
	border-radius: 0.25em;
}

#seventv-tooltip-arrow {
	position: absolute;
}
</style>
