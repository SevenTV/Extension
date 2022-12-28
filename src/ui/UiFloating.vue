<template>
	<div ref="el" class="floating-container">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { autoUpdate, computePosition, Middleware, Placement } from "@floating-ui/dom";
import { onBeforeUnmount, ref, watchEffect } from "vue";

const props = defineProps<{
	anchor?: HTMLElement;
	emitClickout?: boolean;
	middleware?: Middleware[];
	placement?: Placement;
}>();

const emit = defineEmits<{
	(event: "clickout", native: PointerEvent): void;
}>();

const el = ref<HTMLElement>();

let stopUpdating: (() => void) | undefined;

// Places the floating element with the desired configuration whenever the anchor updates.
watchEffect(() => {
	stopUpdating?.();
	stopUpdating = undefined;

	const currentAnchor = props.anchor;
	const currentContainer = el.value;
	const currentMiddleware = props.middleware ?? [];
	const currentPlacement = props.placement;

	if (!currentAnchor || !currentContainer) return;

	stopUpdating = autoUpdate(currentAnchor, currentContainer, () => {
		computePosition(currentAnchor, currentContainer, {
			middleware: currentMiddleware,
			placement: currentPlacement,
		}).then(({ x, y }) => {
			currentContainer.style.top = `${y}px`;
			currentContainer.style.left = `${x}px`;
		});
	});
});

let stopClickout: (() => void) | undefined;

watchEffect(() => {
	stopClickout?.();
	stopClickout = undefined;

	if (props.emitClickout) {
		stopClickout = onClickOutside(el.value, (ev) => emit("clickout", ev));
	}
});

onBeforeUnmount(() => {
	stopUpdating?.();
	stopClickout?.();
});
</script>

<style scoped>
.floating-container {
	position: absolute;
	z-index: 100;
}
</style>
