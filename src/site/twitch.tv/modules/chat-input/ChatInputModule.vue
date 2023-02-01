<template>
	<template v-for="inst in AutocompleteProvider.instances" :key="inst.identifier">
		<ChatInput :instance="inst" />
	</template>
</template>

<script setup lang="ts">
import { useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import { useConfig } from "@/composable/useSettings";
import ChatInput from "./ChatInput.vue";

const { markAsReady } = declareModule("chat-input", {
	name: "Chat Input",
	depends_on: [],
	config: [
		{
			key: "chat_input.autocomplete.colon",
			path: ["Chat", "Autocompletion"],
			label: "Colon-completion",
			hint: "Allows the use of a colon (:) to open a list of partially matching emotes",
			type: "TOGGLE",
			defaultValue: true,
		},
		{
			key: "chat_input.autocomplete.colon.emoji",
			path: ["Chat", "Autocompletion"],
			label: "Colon-completion: Emoji",
			disabledIf: () => !useConfig("chat_input.autocomplete.colon").value,
			hint: "Whether or not to also include emojis in the colon-completion list (This may impact performance)",
			type: "TOGGLE",
			defaultValue: true,
		},
	],
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

defineExpose({
	component: AutocompleteProvider,
	setTray: null as Twitch.ChatAutocompleteComponent["props"]["setTray"] | null,
	setModifierTray: null as Twitch.ChatAutocompleteComponent["props"]["setModifierTray"] | null,
	clearModifierTray: null as Twitch.ChatAutocompleteComponent["props"]["clearModifierTray"] | null,
});
</script>
