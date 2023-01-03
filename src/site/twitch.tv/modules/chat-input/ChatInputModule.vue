<template>
	<template v-for="inst in AutocompleteProvider.instances" :key="inst.identifier">
		<ChatInput :instance="inst" />
	</template>
</template>

<script setup lang="ts">
import { useComponentHook } from "@/common/ReactHooks";
import { useModule } from "@/composable/useModule";
import ChatInput from "./ChatInput.vue";

const { markAsReady } = useModule("chat-input", {
	name: "Chat Input",
	depends_on: [],
});

const AutocompleteProvider = useComponentHook<Twitch.ChatAutocompleteComponent>(
	{
		parentSelector: ".chat-input__textarea",
		predicate: (n) => n.providers,
	},
	{
		trackRoot: true,
	},
);

markAsReady();
</script>
