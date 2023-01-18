<template>
	<template v-for="inst in ChatInputController.instances" :key="inst.identifier">
		<EmoteMenu :instance="inst" :button-el="buttonEl" />
	</template>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import EmoteMenu from "@/site/twitch.tv/modules/emote-menu/EmoteMenu.vue";

const { markAsReady } = declareModule("emote-menu", {
	name: "Emote Menu",
	depends_on: [],
});

const buttonEl = ref<HTMLButtonElement | undefined>();

const ChatInputController = useComponentHook<Twitch.ChatInputController>(
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
