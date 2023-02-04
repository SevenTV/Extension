<template>
	<template v-for="({ parent, component, props }, i) of tButtons" :key="i">
		<Teleport v-if="parent.current" :to="parent.current">
			<Component :is="component" v-bind="props" />
		</Teleport>
	</template>
</template>

<script setup lang="ts">
import { markRaw, reactive, ref } from "vue";
import { REACT_TYPEOF_TOKEN } from "@/common/Constant";
import { REACT_ELEMENT_SYMBOL, useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";

const { markAsReady } = declareModule("chat-input-controller", {
	name: "Controller: Chat Input",
	depends_on: ["chat"],
	config: [],
});

// Button renderer
const tButtons = reactive(new Set<InsertedButton<ComponentFactory>>());
useComponentHook<Twitch.ChatInputControllerComponent>(
	{
		parentSelector: ".chat-input",
		predicate: (n) => {
			return n.handleGlobalMousedown && n.props && n.props.children && n.props.onClickOut;
		},
	},
	{
		hooks: {
			render(inst, cur) {
				if (!inst.component.container || !inst.component.container.parentElement) return cur;
				if (!inst.component.container.parentElement.classList.contains("chat-input")) return cur;

				const props = (cur as ReactExtended.ReactRuntimeElement).props ?? {};
				const child = (props.children as ReactExtended.ReactRuntimeElement[]).find(
					(c) => c.props.className === "chat-input__buttons-container",
				);
				if (!child) return cur;

				const buttons = child.props.children.at(-1);
				if (!buttons) return cur;

				for (const btn of tButtons) {
					buttons.props.children.splice(buttons.props.children.length - btn.offset, 0, {
						[REACT_TYPEOF_TOKEN]: REACT_ELEMENT_SYMBOL,
						key: null,
						ref: btn.parent,
						type: "seventv-chat-input-button-container",
						props: {},
					});
				}

				return cur;
			},
		},
	},
);

/**
 * Add a button under the chat input, with a given offset
 *
 * @param offset value begins from the end
 */
function addButton<T extends ComponentFactory>(com: T, props: InstanceType<T>["$props"], offset: number) {
	const track = ref({ current: null as HTMLElement | null });

	tButtons.add({
		offset,
		parent: track.value,
		component: markRaw(com),
		props,
	});

	return track;
}

interface InsertedButton<T extends ComponentFactory> {
	offset: number;
	parent: { current: Element | null };
	component: InstanceType<T>;
	props: InstanceType<T>["props"];
}

defineExpose({
	addButton,
});

markAsReady();
</script>
