<template>
	<div ref="el" class="floating-container">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watchEffect } from "vue";
import { onClickOutside } from "@vueuse/core";
import { Middleware, Placement, VirtualElement, autoUpdate, computePosition } from "@floating-ui/dom";

const props = defineProps<{
	anchor?: Element;
	position?: [x: number, y: number];
	emitClickout?: boolean;
	middleware?: Middleware[];
	placement?: Placement;
	once?: boolean;
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
	if (!currentContainer) return;

	const virtual = {
		getBoundingClientRect: () => ({
			top: props.position?.[1] ?? 0,
			left: props.position?.[0] ?? 0,
			width: 0,
			height: 0,
		}),
	} as VirtualElement;

	const compute = () => {
		computePosition(currentAnchor ?? virtual, currentContainer, {
			middleware: currentMiddleware,
			placement: currentPlacement,
		}).then(({ x, y }) => {
			currentContainer.style.top = `${y}px`;
			currentContainer.style.left = `${x}px`;
		});
	};

	if (!props.once) {
		stopUpdating = autoUpdate(currentAnchor ?? virtual, currentContainer, compute);
	} else {
		compute();
	}
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
	z-index: 1000;
}
</style>
