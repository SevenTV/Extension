<template>
	<template v-for="inst in chatInputController.instances" :key="inst.identifier">
		<EmoteMenu :instance="inst" :button-el="buttonEl" />
	</template>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import EmoteMenu from "./EmoteMenu.vue";

const { markAsReady } = declareModule("emote-menu", {
	name: "Emote Menu",
	depends_on: ["settings"],
	config: [
		{
			key: "ui.emote_menu_search",
			path: ["Appearance", "Interface"],
			label: "Search with input box",
			hint: "Use the normal chat inputbox to search in the emote menu instead of the dedicated search box",
			type: "TOGGLE",
			defaultValue: false,
		},
	],
});

const buttonEl = ref<HTMLButtonElement | undefined>();

const chatInputController = useComponentHook<Twitch.ChatInputController>(
	{
		parentSelector: ".chat-room__content",
		predicate: (n) => n.onEmotePickerButtonClick,
	},
	{
		trackRoot: true,
		hooks: {
			update(instance) {
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
