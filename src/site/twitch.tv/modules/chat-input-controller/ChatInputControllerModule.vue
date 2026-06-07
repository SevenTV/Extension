<template>
	<template v-for="({ parent, component, props, condition }, i) of tButtons.values()" :key="i">
		<Teleport v-if="parent.current && isButtonActive(condition)" :to="parent.current">
			<Component :is="component" v-bind="props" />
		</Teleport>
	</template>
</template>

<script setup lang="ts">
import { markRaw, onMounted, onUnmounted, onUpdated, reactive, ref } from "vue";
import { declareModule } from "@/composable/useModule";

const { markAsReady } = declareModule("chat-input-controller", {
	name: "Controller: Chat Input",
	depends_on: ["chat"],
});

// Button renderer
const tButtons = reactive(new Map<string, InsertedButton<ComponentFactory>>());
let mountFrame = 0;
let observer: MutationObserver | undefined;

onMounted(() => {
	observer = new MutationObserver(() => scheduleRemount());
	observer.observe(document, {
		childList: true,
		subtree: true,
	});

	scheduleRemount();
});

onUpdated(() => {
	scheduleRemount();
});

onUnmounted(() => {
	observer?.disconnect();
	observer = undefined;

	if (mountFrame) {
		cancelAnimationFrame(mountFrame);
		mountFrame = 0;
	}

	for (const btn of tButtons.values()) {
		btn.parent.current?.remove();
	}
});

/**
 * Add a button under the chat input, with a given offset
 *
 * @param offset value begins from the end
 */
function addButton<T extends ComponentFactory>(
	key: string,
	com: T,
	props: InstanceType<T>["$props"],
	offset: number,
	condition?: () => boolean,
) {
	const container = document.createElement("seventv-chat-input-button-container");
	const track = ref({ current: container as HTMLElement | null });

	tButtons.set(key, {
		key,
		offset,
		parent: track.value,
		component: markRaw(com),
		props,
		condition: condition ?? (() => true),
	});

	scheduleRemount();

	return track;
}

function scheduleRemount() {
	if (mountFrame) return;

	mountFrame = requestAnimationFrame(() => {
		mountFrame = 0;
		remountButtons();
	});
}

function remountButtons() {
	const row = document.querySelector<HTMLElement>("div[data-test-selector='chat-input-buttons-container']");
	if (!row) return;

	const anchor =
		row.querySelector<HTMLElement>("button[data-a-target='chat-settings']") ??
		row.querySelector<HTMLElement>("button[data-a-target='chat-send-button']");
	const wrapper = anchor?.parentElement;
	const container = wrapper?.parentElement ?? row;

	const buttons = [...tButtons.values()].sort((a, b) => b.offset - a.offset);

	let reference: Element | null = wrapper ?? anchor;
	for (let i = buttons.length - 1; i >= 0; i--) {
		const btn = buttons[i];
		const el = btn.parent.current;
		if (!el) continue;

		if (!isButtonActive(btn.condition)) {
			el.remove();
			continue;
		}

		if (el.parentElement !== container || el.nextSibling !== reference) {
			container.insertBefore(el, reference);
		}

		reference = el;
	}
}

function isButtonActive(condition?: () => boolean): boolean {
	return typeof condition !== "function" || condition();
}

interface InsertedButton<T extends ComponentFactory> {
	key: string;
	offset: number;
	parent: { current: Element | null };
	component: InstanceType<T>;
	props: InstanceType<T>["props"];
	condition?: () => boolean;
}

defineExpose({
	addButton,
});

markAsReady();
</script>

<style lang="scss">
div[data-test-selector="chat-input-buttons-container"] seventv-chat-input-button-container {
	display: flex;
	align-items: center;
}

div[data-test-selector="chat-input-buttons-container"] > div:has(button[data-a-target="chat-settings"]) {
	display: contents !important;

	> :not(:has(button)) {
		display: none !important;
	}
}
</style>
