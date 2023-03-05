<template>
	<template v-for="inst in chatInputController.instances" :key="inst.identifier">
		<EmoteMenu v-if="shouldMount.get(inst)" :instance="inst" :button-el="buttonEl" />
	</template>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { HookedInstance, useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import { declareConfig } from "@/composable/useSettings";
import EmoteMenu from "./EmoteMenu.vue";

const { markAsReady } = declareModule("emote-menu", {
	name: "Emote Menu",
	depends_on: ["settings"],
});

const buttonEl = ref<HTMLButtonElement | undefined>();
const shouldMount = reactive(new WeakMap<HookedInstance<Twitch.ChatInputController>, boolean>());

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
			update(instance) {
				shouldMount.set(instance, !!instance.component.props.channelID);

				// TODO: make a proper hook for this and drop DOM manipulations
				for (const n of Object.values(instance.domNodes)) {
					const btn = n.querySelector<HTMLButtonElement>("button[data-a-target='emote-picker-button']");
					if (!btn) continue;
					buttonEl.value = btn;
					for (let i = 0; i < btn.childElementCount; i++) {
						const el = btn.children[i];
						if (el.classList.contains("seventv-emote-menu-button")) continue;
						el.remove();
					}
				}
			},
		},
	},
);

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("ui.emote_menu_search", "TOGGLE", {
		path: ["Appearance", "Interface"],
		label: "Live Input Search",
		hint: "Use the chat's regular input box to search in the emote menu instead of the integrated search box",
		defaultValue: false,
	}),
	declareConfig<Set<string>>("ui.emote_menu.collapsed_sets", "NONE", {
		path: ["", ""],
		label: "Emote Menu",
		defaultValue: new Set(),
	}),
];
</script>
