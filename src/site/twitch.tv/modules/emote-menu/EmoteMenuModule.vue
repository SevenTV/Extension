<template>
	<template v-for="inst in ChatInputController.instances" :key="inst.identifier">
		<EmoteMenu :instance="inst" />
	</template>
</template>

<script setup lang="ts">
import { useComponentHook } from "@/common/ReactHooks";
import { useModule } from "@/composable/useModule";
import EmoteMenu from "./EmoteMenu.vue";

const { markAsReady } = useModule("emote-menu", {
	name: "Emote Menu",
	depends_on: [],
});

const ChatInputController = useComponentHook<Twitch.ChatInputController>(
	{
		parentSelector: ".chat-room__content",
		predicate: (n) => n.onEmotePickerButtonClick,
	},
	{
		trackRoot: true,
	},
);

markAsReady();
</script>
