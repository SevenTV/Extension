<template>
	<template v-for="inst in chatInputController.instances" :key="inst.identifier">
		<EmoteMenu v-if="shouldMount.get(inst)" :instance="inst" :button-el="buttonEl" />
	</template>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { HookedInstance, useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import { declareConfig } from "@/composable/useSettings";
import EmoteMenu from "./EmoteMenu.vue";
import { debounceFn } from "@/common/Async";
import { useConfig } from "@/composable/useSettings";

const { markAsReady } = declareModule("emote-menu", {
	name: "Emote Menu",
	depends_on: ["settings"],
});

const buttonEl = ref<HTMLButtonElement | undefined>();
const shouldMount = reactive(new WeakMap<HookedInstance<Twitch.ChatInputController>, boolean>());
const placement = useConfig<"regular" | "below" | "hidden">("ui.emote_menu.button_placement");

const chatInputController = useComponentHook<Twitch.ChatInputController>(
	{
		parentSelector: ".chat-room__content",
		maxDepth: 150,
		predicate: (n) => n.onEmotePickerButtonClick,
	},
	{
		trackRoot: true,
		containerClass: "seventv-chat-input-container",
		hooks: {
			render(instance, cur) {
				shouldMount.set(instance, !!instance.component.props.channelID);

				doButtonUpdate(Object.values(instance.domNodes));
				return cur;
			},
		},
	},
);

// TODO: make a proper hook for this and drop DOM manipulations
const doButtonUpdate = debounceFn((nodes: Element[]) => {
	for (const n of nodes) {
		const btn = n.querySelector<HTMLButtonElement>("button[data-a-target='emote-picker-button']");
		if (!btn) continue;

		buttonEl.value = btn;

		for (let i = 0; i < btn.childElementCount; i++) {
			const el = btn.children[i];
			if (el.classList.contains("seventv-emote-menu-button")) continue;

			placement.value === "regular"
				? el.classList.add("seventv-emote-menu-overriden")
				: el.classList.remove("seventv-emote-menu-overriden");
		}
	}
}, 50);

watch(
	placement,
	(v) => {
		for (const n of Object.values(chatInputController.instances).map((i) => i.domNodes)) {
			doButtonUpdate(Object.values(n));
		}
	},
	{ immediate: true },
);

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("ui.emote_menu_search", "TOGGLE", {
		path: ["Appearance", "Interface"],
		label: "Emote Menu: Live Input Search",
		hint: "Use the chat's regular input box to search in the emote menu instead of the integrated search box",
		defaultValue: false,
	}),
	declareConfig<string>("ui.emote_menu.button_placement", "DROPDOWN", {
		path: ["Appearance", "Interface"],
		label: "Emote Menu Button Placement",
		hint: "Control where the 7TV emote menu button is placed",
		options: [
			["Regular", "regular"],
			["Below Input", "below"],
			["Hidden", "hidden"],
		],
		defaultValue: "regular",
	}),
	declareConfig<Set<string>>("ui.emote_menu.favorites", "NONE", {
		path: ["", ""],
		label: "",
		defaultValue: new Set(),
	}),
	declareConfig<Map<string, number>>("ui.emote_menu.usage", "NONE", {
		path: ["", ""],
		label: "",
		defaultValue: new Map(),
	}),
	declareConfig<Set<string>>("ui.emote_menu.collapsed_sets", "NONE", {
		path: ["", ""],
		label: "",
		defaultValue: new Set(),
	}),
];
</script>

<style lang="scss">
.seventv-emote-menu-overriden {
	display: none;
}
</style>
