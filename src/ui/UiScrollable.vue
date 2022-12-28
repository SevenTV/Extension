<template>
	<div class="scrollable-container">
		<div
			ref="container"
			class="scrollable-contents"
			@scroll.passive="onScroll"
			@wheel.passive="onWheel"
			@mousemove.passive="flashScrollbar()"
		>
			<slot></slot>
		</div>
		<div
			v-if="scrollable"
			ref="scrollbar"
			class="scrollbar"
			:visible="isVisible"
			:is-active="isActive"
			@mousedown="onTrackDown"
		>
			<div
				class="scrollbar-thumb"
				:style="{ top: `${thumbTop}px`, height: `${thumbHeight}px` }"
				@mousedown.stop="onThumbDown"
			></div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

let resizeObserver: ResizeObserver | undefined;
let childObserver: MutationObserver | undefined;

let hideTimeout: number | undefined;
let hideTimeoutCooldown = 0;

let dragTimeout: number | undefined;
const dragOffset = ref(0);
const dragRefRect = ref<DOMRect | undefined>();

let repeatDirectionInterval: number | undefined;

const container = ref<HTMLDivElement | undefined>();
const scrollbar = ref<HTMLDivElement | undefined>();

const isActive = ref(false);

const scrollable = ref(false);

const isVisible = ref(false);

const thumbTop = ref(0);
const thumbHeight = ref(0);

const emit = defineEmits<{
	(event: "container-scroll", native: Event): void;
	(event: "container-wheel", native: WheelEvent): void;
}>();

function updateScrollbar() {
	if (!container.value) return;

	const el = container.value;

	if (el.scrollHeight > el.clientHeight) {
		scrollable.value = true;

		thumbTop.value = (el.scrollTop / el.scrollHeight) * el.clientHeight;
		thumbHeight.value = (el.clientHeight / el.scrollHeight) * el.clientHeight;

		flashScrollbar();
	} else {
		scrollable.value = false;
	}
}

function flashScrollbar() {
	if (!scrollable.value) return;

	const now = Date.now();

	if (now < hideTimeoutCooldown) return;

	hideTimeoutCooldown = now + 500;

	isVisible.value = true;

	if (hideTimeout) clearTimeout(hideTimeout);

	hideTimeout = window.setTimeout(() => {
		isVisible.value = false;
	}, 1000);
}

function scrollByNotch(up = true) {
	if (!container.value) return;

	if (up) {
		container.value.scrollBy({ top: -200 });
	} else {
		container.value.scrollBy({ top: 200 });
	}
}

function onScroll(ev: Event) {
	emit("container-scroll", ev);

	updateScrollbar();
}

function onWheel(ev: WheelEvent) {
	emit("container-wheel", ev);
}

function onTrackDown(ev: MouseEvent) {
	if (repeatDirectionInterval) {
		clearInterval(repeatDirectionInterval);
		repeatDirectionInterval = undefined;
	}

	if (!scrollbar.value || scrollbar.value !== ev.target) return;

	const up = ev.offsetY < thumbTop.value;

	scrollByNotch(up);

	repeatDirectionInterval = window.setInterval(() => {
		scrollByNotch(up);
	}, 150);

	isActive.value = true;

	window.removeEventListener("mouseup", onTrackUp);

	window.addEventListener("mouseup", onTrackUp);

	ev.preventDefault();
}

function onTrackUp() {
	if (repeatDirectionInterval) {
		clearInterval(repeatDirectionInterval);
		repeatDirectionInterval = undefined;
	}

	isActive.value = false;

	window.removeEventListener("mouseup", onTrackUp);
}

function onThumbDown(ev: MouseEvent) {
	if (!scrollbar.value) return;

	dragOffset.value = ev.offsetY;
	dragRefRect.value = scrollbar.value.getBoundingClientRect();

	isActive.value = true;

	window.removeEventListener("mouseup", onThumbUp);
	window.removeEventListener("mousemove", onThumbMove);

	window.addEventListener("mouseup", onThumbUp);
	window.addEventListener("mousemove", onThumbMove);

	ev.preventDefault();
}

function onThumbUp() {
	dragOffset.value = 0;
	dragRefRect.value = undefined;

	isActive.value = false;

	window.removeEventListener("mouseup", onThumbUp);
	window.removeEventListener("mousemove", onThumbMove);
}

function onThumbMove(ev: MouseEvent) {
	if (dragTimeout) return;

	dragTimeout = requestAnimationFrame(() => {
		dragTimeout = undefined;

		if (!dragRefRect.value) return;
		if (!container.value) return;

		const location = (ev.pageY - dragRefRect.value.top - dragOffset.value) / dragRefRect.value.height;

		const scrollTarget = container.value.scrollHeight * location;

		container.value.scrollTo({ top: scrollTarget });
	});
}

defineExpose({
	container,
	scrollbar,
	isActive,
});

onMounted(() => {
	if (!container.value) return;

	resizeObserver = new ResizeObserver(() => {
		updateScrollbar();
	});

	container.value.childNodes.forEach((node) => {
		if (node instanceof Element) {
			resizeObserver?.observe(node);
		}
	});

	childObserver = new MutationObserver((entries) => {
		updateScrollbar();

		if (!resizeObserver) return;

		for (const entry of entries) {
			entry.addedNodes.forEach((node) => {
				if (node instanceof Element) {
					resizeObserver?.observe(node);
				}
			});

			entry.removedNodes.forEach((node) => {
				if (node instanceof Element) {
					resizeObserver?.unobserve(node);
				}
			});
		}
	});

	resizeObserver.observe(container.value);

	childObserver.observe(container.value, { childList: true });

	updateScrollbar();
});

onUnmounted(() => {
	if (childObserver) childObserver.disconnect();

	if (resizeObserver) resizeObserver.disconnect();

	if (hideTimeout) clearTimeout(hideTimeout);

	if (repeatDirectionInterval) clearInterval(repeatDirectionInterval);

	if (dragTimeout) cancelAnimationFrame(dragTimeout);

	window.removeEventListener("mouseup", onTrackUp);
	window.removeEventListener("mouseup", onThumbUp);
	window.removeEventListener("mousemove", onThumbMove);
});
</script>

<style scoped lang="scss">
.scrollable-container {
	overflow: hidden;
	position: relative;

	--theme-background-scrollbar-thumb: rgb(84, 84, 84);
	--theme-background-scrollbar: rgb(50, 53, 66);
	--theme-background-scrollbar-thumb-pressed: rgb(110, 110, 110);

	.scrollable-contents {
		height: 100%;
		width: 100%;
		scrollbar-width: none;
		overflow-y: scroll;

		&::-webkit-scrollbar {
			width: 0;
			height: 0;
		}
	}

	.scrollbar {
		position: absolute;
		top: 0;
		right: 0;
		height: 100%;

		padding: 0 0.1rem;
		box-sizing: border-box;

		cursor: pointer;

		opacity: 0;
		transition: 0.3s linear opacity;

		z-index: 9999;

		.scrollbar-thumb {
			position: relative;
			width: 0.4rem;
			background-color: var(--theme-background-scrollbar-thumb);

			$clipAngle: 0.15em;
			clip-path: polygon(
				50% 0,
				100% $clipAngle,
				100% calc(100% - $clipAngle),
				50% 100%,
				0 calc(100% - $clipAngle),
				0 $clipAngle
			);

			&:hover {
				background-color: var(--theme-background-scrollbar-thumb-pressed);
			}
		}

		&[visible="true"] {
			opacity: 1;
		}

		&[is-active="true"] {
			opacity: 1;
			background-color: var(--theme-background-scrollbar);

			.scrollbar-thumb {
				background-color: var(--theme-background-scrollbar-thumb-pressed);
			}
		}

		&:hover {
			opacity: 1;
		}
	}
}
</style>
