<template />

<script setup lang="ts">
import { onUnmounted, watch } from "vue";
import { declareModule } from "@/composable/useModule";
import { declareConfig, useConfig } from "@/composable/useSettings";

const { markAsReady } = declareModule("whispers", {
	name: "Whispers",
	depends_on: [],
});

const resizingEnabled = useConfig<boolean>("whispers.resizable");

const THREAD_SELECTOR = ".whispers-thread";
const HANDLE_CLASS = "seventv-whisper-resize-handle";
const READY_ATTR = "data-seventv-resizable";
const STORAGE_KEY = "seventv-whisper-thread-size";

const MIN_WIDTH = 300;
const MIN_HEIGHT = 250;
const VIEWPORT_MARGIN = 40;

interface StoredSize {
	width: number;
	height: number;
}

function loadStoredSize(): StoredSize | undefined {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return undefined;

		const parsed = JSON.parse(raw) as Partial<StoredSize>;
		if (typeof parsed.width === "number" && typeof parsed.height === "number") {
			return parsed as StoredSize;
		}
	} catch {
		// corrupt or inaccessible storage - ignore and fall back to defaults
	}

	return undefined;
}

function storeSize(size: StoredSize): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(size));
	} catch {
		// storage may be unavailable (private mode, quota exceeded, etc.)
	}
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function clampSize(width: number, height: number): StoredSize {
	const maxWidth = window.innerWidth - VIEWPORT_MARGIN;
	const maxHeight = window.innerHeight - VIEWPORT_MARGIN;

	return {
		width: clamp(width, MIN_WIDTH, Math.max(MIN_WIDTH, maxWidth)),
		height: clamp(height, MIN_HEIGHT, Math.max(MIN_HEIGHT, maxHeight)),
	};
}

function applySize(thread: HTMLElement, width: number, height: number): StoredSize {
	const { width: w, height: h } = clampSize(width, height);

	thread.style.setProperty("width", `${w}px`, "important");
	thread.style.setProperty("height", `${h}px`, "important");
	thread.style.setProperty("max-height", `${h}px`, "important");

	return { width: w, height: h };
}

const TITLE_BAR_SELECTOR = ".thread-header__title-bar-container";

const FOCUSED_CLASS = "whispers-thread--focused";

interface ThreadState {
	titleBar?: HTMLElement;
	captureListener?: (ev: Event) => void;
}

const threadStates = new WeakMap<HTMLElement, ThreadState>();
const threadObservers = new WeakMap<HTMLElement, MutationObserver>();

function placeHandle(thread: HTMLElement, handle: HTMLElement): void {
	const state = threadStates.get(thread) ?? {};
	const titleBar = thread.querySelector<HTMLElement>(TITLE_BAR_SELECTOR);

	if (titleBar === state.titleBar && titleBar?.contains(handle)) return;

	if (state.titleBar && state.captureListener) {
		state.titleBar.removeEventListener("click", state.captureListener, true);
	}

	if (titleBar) {
		handle.classList.remove(`${HANDLE_CLASS}-overlay`);
		handle.classList.add(`${HANDLE_CLASS}-inline`);
		titleBar.prepend(handle);

		const captureListener = (clickEv: Event) => {
			if (handle.contains(clickEv.target as Node)) return;
			thread.style.removeProperty("width");
			thread.style.removeProperty("height");
			thread.style.removeProperty("max-height");
		};
		titleBar.addEventListener("click", captureListener, true);

		state.titleBar = titleBar;
		state.captureListener = captureListener;
	} else {
		handle.classList.remove(`${HANDLE_CLASS}-inline`);
		handle.classList.add(`${HANDLE_CLASS}-overlay`);
		if (getComputedStyle(thread).position === "static") {
			thread.style.position = "relative";
		}

		thread.prepend(handle);
		state.titleBar = undefined;
		state.captureListener = undefined;
	}

	threadStates.set(thread, state);
}

function watchThread(thread: HTMLElement, handle: HTMLElement): void {
	const observer = new MutationObserver(() => {
		placeHandle(thread, handle);

		if (thread.classList.contains(FOCUSED_CLASS)) {
			const stored = loadStoredSize();
			if (stored) applySize(thread, stored.width, stored.height);
			return;
		}

		thread.style.removeProperty("width");
		thread.style.removeProperty("height");
		thread.style.removeProperty("max-height");
	});

	observer.observe(thread, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
	threadObservers.set(thread, observer);
}

function setupHandle(thread: HTMLElement): void {
	if (thread.hasAttribute(READY_ATTR)) return;
	thread.setAttribute(READY_ATTR, "true");
	thread.classList.add("seventv-whisper-resizable");

	const stored = loadStoredSize();
	if (stored) applySize(thread, stored.width, stored.height);

	const handle = document.createElement("div");
	handle.className = HANDLE_CLASS;
	handle.setAttribute("role", "separator");
	handle.setAttribute("aria-label", "Resize whisper window");

	placeHandle(thread, handle);
	watchThread(thread, handle);

	const swallow = (guardEv: Event) => guardEv.stopPropagation();
	handle.addEventListener("click", swallow);
	handle.addEventListener("pointerup", swallow);

	handle.addEventListener("pointerdown", (ev: PointerEvent) => {
		if (ev.button !== 0) return;
		ev.preventDefault();
		ev.stopPropagation();

		const startX = ev.clientX;
		const startY = ev.clientY;
		const rect = thread.getBoundingClientRect();
		const startWidth = rect.width;
		const startHeight = rect.height;

		const anchorRight = rect.right;
		const anchorBottom = rect.bottom;

		handle.setPointerCapture(ev.pointerId);
		document.body.classList.add("seventv-whisper-resizing");

		const preview = document.createElement("div");
		preview.className = "seventv-whisper-resize-preview";
		document.body.appendChild(preview);

		const positionPreview = (size: StoredSize) => {
			preview.style.left = `${anchorRight - size.width}px`;
			preview.style.top = `${anchorBottom - size.height}px`;
			preview.style.width = `${size.width}px`;
			preview.style.height = `${size.height}px`;
		};

		let latest = clampSize(startWidth, startHeight);
		positionPreview(latest);

		let rafHandle = 0;
		const flush = () => {
			rafHandle = 0;
			positionPreview(latest);
		};

		const onMove = (moveEv: PointerEvent) => {
			const dx = startX - moveEv.clientX;
			const dy = startY - moveEv.clientY;

			latest = clampSize(startWidth + dx, startHeight + dy);
			if (!rafHandle) rafHandle = requestAnimationFrame(flush);
		};

		const onUp = (upEv: PointerEvent) => {
			handle.releasePointerCapture(upEv.pointerId);
			document.body.classList.remove("seventv-whisper-resizing");

			if (rafHandle) cancelAnimationFrame(rafHandle);
			preview.remove();

			storeSize(applySize(thread, latest.width, latest.height));

			window.removeEventListener("pointermove", onMove);
		};

		window.addEventListener("pointermove", onMove);

		handle.addEventListener("pointerup", onUp, { once: true });
	});
}

function teardownHandle(thread: HTMLElement): void {
	thread.removeAttribute(READY_ATTR);
	thread.classList.remove("seventv-whisper-resizable");
	thread.style.removeProperty("width");
	thread.style.removeProperty("height");
	thread.style.removeProperty("max-height");

	threadObservers.get(thread)?.disconnect();
	threadObservers.delete(thread);

	const state = threadStates.get(thread);
	if (state?.titleBar && state.captureListener) {
		state.titleBar.removeEventListener("click", state.captureListener, true);
	}
	threadStates.delete(thread);

	thread.querySelector(`.${HANDLE_CLASS}`)?.remove();
}

function scanAndSetup(root: ParentNode): void {
	root.querySelectorAll<HTMLElement>(THREAD_SELECTOR).forEach(setupHandle);
}

function scanAndTeardown(root: ParentNode): void {
	root.querySelectorAll<HTMLElement>(`${THREAD_SELECTOR}[${READY_ATTR}]`).forEach(teardownHandle);
}

let observer: MutationObserver | undefined;

watch(
	resizingEnabled,
	(enabled) => {
		if (enabled) {
			scanAndSetup(document.body);
		} else {
			scanAndTeardown(document.body);
		}
	},
	{ immediate: true },
);

observer = new MutationObserver((mutations) => {
	if (!resizingEnabled.value) return;

	for (const mutation of mutations) {
		mutation.addedNodes.forEach((node) => {
			if (!(node instanceof HTMLElement)) return;

			if (node.matches(THREAD_SELECTOR)) {
				setupHandle(node);
			} else {
				node.querySelectorAll<HTMLElement>(THREAD_SELECTOR).forEach(setupHandle);
			}
		});
	}
});

observer.observe(document.body, { childList: true, subtree: true });

onUnmounted(() => {
	observer?.disconnect();
	observer = undefined;

	scanAndTeardown(document.body);
});

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("whispers.resizable", "TOGGLE", {
		path: ["Chat", "Whispers"],
		label: "Resizable Whisper Window",
		hint: "If checked, a drag handle is added to the top-left corner of whisper (DM) windows, letting you resize them by dragging.",
		defaultValue: true,
	}),
];
</script>

<style lang="scss">
.seventv-whisper-resize-handle {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border-radius: 6px;
	background-color: rgba(0, 0, 0, 65%);
	box-shadow: 0 1px 3px rgba(0, 0, 0, 40%);
	cursor: nwse-resize;
	touch-action: none;
	opacity: 0.85;
	transition:
		opacity 0.15s ease,
		background-color 0.15s ease;

	&::before {
		content: "";
		width: 9px;
		height: 9px;
		border-top: 2px solid #fff;
		border-left: 2px solid #fff;
		border-radius: 2px 0 0;
	}

	&:hover {
		background-color: rgba(0, 0, 0, 80%);
		opacity: 1;
	}
}

.seventv-whisper-resize-handle-inline {
	flex: 0 0 auto;
	margin-right: 8px;
}

// Without this, the title bar can run out of room and wrap our handle onto
// its own full-width line - which then swallows clicks meant for empty
// space in the bar (blocking Twitch's own collapse/minimize toggle).
/* stylelint-disable-next-line selector-class-pattern */
.thread-header__title-bar-container:has(> .seventv-whisper-resize-handle-inline) {
	flex-wrap: nowrap !important;
}

.seventv-whisper-resize-handle-overlay {
	position: absolute;
	top: 4px;
	left: 4px;
	z-index: 20;
}

body.seventv-whisper-resizing {
	cursor: nwse-resize !important;
	user-select: none !important;

	.whispers-thread {
		pointer-events: none;
	}

	.seventv-whisper-resize-handle {
		pointer-events: all;
	}
}

.seventv-whisper-resize-preview {
	position: fixed;
	z-index: 2147483647;
	border: 2px dashed rgba(255, 255, 255, 80%);
	border-radius: 8px;
	background-color: rgba(255, 255, 255, 8%);
	pointer-events: none;
}
</style>
