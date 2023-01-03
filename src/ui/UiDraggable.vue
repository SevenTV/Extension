<template>
	<div ref="el" class="draggable-container" :style="{ top: `${y}px`, left: `${x}px` }">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch, watchEffect } from "vue";
import { onClickOutside, useDraggable } from "@vueuse/core";
import { Middleware, Placement, ReferenceElement, autoUpdate, computePosition, shift } from "@floating-ui/dom";

const props = defineProps<{
	initialPosition?: [number, number];
	initialAnchor?: ReferenceElement;
	initialMiddleware?: Middleware[];
	initialPlacement?: Placement;
	emitClickout?: boolean;
}>();

const emit = defineEmits<{
	(event: "clickout", native: PointerEvent): void;
}>();

const el = ref<HTMLDivElement>();

const middleware = [shift({ crossAxis: true, mainAxis: true })];

let positionOwner: symbol | undefined;
const x = ref(0);
const y = ref(0);

async function updatePosition(tX: number, tY: number) {
	if (!el.value) return;

	const id = Symbol();
	positionOwner = id;

	const { x: cX, y: cY } = await computePosition(
		{
			getBoundingClientRect() {
				return {
					width: 0,
					height: 0,
					x: tX,
					y: tY,
					top: tY,
					left: tX,
					right: tX,
					bottom: tY,
				};
			},
			contextElement: props.initialAnchor instanceof HTMLElement ? props.initialAnchor : undefined,
		},
		el.value,
		{
			middleware: middleware,
			placement: "bottom-start",
		},
	);

	if (positionOwner === id) {
		x.value = cX;
		y.value = cY;
	}
}

async function positionToAnchor(anchor: ReferenceElement) {
	if (!el.value) return;

	const { x: tX, y: tY } = await computePosition(anchor, el.value, {
		middleware: props.initialMiddleware,
		placement: props.initialPlacement,
	});

	await updatePosition(tX, tY);
}

let dragTimeout: number | undefined;

useDraggable(el, {
	onMove({ x, y }) {
		if (!dragTimeout) {
			window.requestAnimationFrame(() => {
				updatePosition(x, y);
				dragTimeout = undefined;
			});
		}
	},
	preventDefault: true,
});

let stopUpdating: (() => void) | undefined;

watch(
	() => [el.value, props.initialPosition, props.initialMiddleware, props.initialPlacement],
	() => {
		stopUpdating?.();
		stopUpdating = undefined;

		const currentContainer = el.value;
		if (!currentContainer) return;

		let init = true;
		stopUpdating = autoUpdate(
			{
				getBoundingClientRect() {
					return {
						width: 0,
						height: 0,
						x: x.value,
						y: y.value,
						top: y.value,
						left: x.value,
						right: x.value,
						bottom: y.value,
					};
				},
				contextElement: props.initialAnchor instanceof HTMLElement ? props.initialAnchor : undefined,
			},
			currentContainer,
			() => {
				if (init) {
					if (props.initialAnchor) {
						positionToAnchor(props.initialAnchor);
					} else {
						const tX = props.initialPosition?.[0] ?? 0;
						const tY = props.initialPosition?.[1] ?? 0;
						updatePosition(tX, tY);
					}
					init = false;
				} else {
					updatePosition(x.value, y.value);
				}
			},
		);
	},
	{ immediate: true },
);

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

	if (dragTimeout) cancelAnimationFrame(dragTimeout);
});
</script>

<style scoped>
.draggable-container {
	position: fixed;
	z-index: 9999;

	cursor: pointer;
}
</style>
