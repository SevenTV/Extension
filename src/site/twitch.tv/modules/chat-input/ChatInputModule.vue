<template>
	<template v-for="inst in AutocompleteProvider.instances" :key="inst.identifier">
		<ChatInput v-if="shouldMount.get(inst)" :instance="inst" />
		<ChatSpam v-if="shouldMount.get(inst)" />
	</template>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { HookedInstance, useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import { useConfig } from "@/composable/useSettings";
import ChatInput from "./ChatInput.vue";
import ChatSpam from "./ChatSpam.vue";

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
		{
			key: "chat_input.autocomplete.chatters",
			path: ["Chat", "Autocompletion"],
			label: "Autocompleter chatters",
			hint: "Whether or not to consider the usernames of active chatters when using tab-completion",
			type: "TOGGLE",
			defaultValue: true,
		},
		{
			key: "chat_input.spam.bypass_duplicate",
			path: ["Chat", "Typing"],
			label: "Bypass Duplicate Message Check",
			hint: "If enabled, you will be able to send the same message multiple times in a row",
			type: "TOGGLE",
			defaultValue: false,
		},
		{
			key: "chat_input.spam.rapid_fire_send",
			path: ["Chat", "Typing"],
			label: "Quick Send",
			hint: "If enabled, you can use the Ctrl+Enter shortcut to keep the current message in the input box after sending",
			type: "TOGGLE",
			defaultValue: true,
		},
	],
});

const shouldMount = reactive(new WeakMap<HookedInstance<Twitch.ChatAutocompleteComponent>, boolean>());
const shouldBypassDuplicateCheck = useConfig("chat_input.spam.bypass_duplicate");

const AutocompleteProvider = useComponentHook<Twitch.ChatAutocompleteComponent>(
	{
		parentSelector: ".chat-input__textarea",
		maxDepth: 50,
		predicate: (n) => n.providers,
	},
	{
		trackRoot: true,
		hooks: {
			update(instance) {
				shouldMount.set(instance, !!instance.component.componentRef?.props?.channelID);
			},
		},
	},
);

// Neuter message restriction trays
const hookChecks = [
	{ key: "message-throughput", stateKey: "" },
	{ key: "duplicated-messages", stateKey: "lastSentMessage" },
] as { key: string; stateKey: keyof MessageCheckComponent["state"] }[];

for (const hc of hookChecks) {
	useComponentHook<MessageCheckComponent>(
		{
			parentSelector: ".chat-input",
			maxDepth: 20,
			predicate: (n) => {
				return n.props.setModifierTray && n.key === hc.key;
			},
		},
		{
			hooks: {
				update(instance) {
					if (!shouldBypassDuplicateCheck.value) return;

					if (hc.stateKey) instance.component.state[hc.stateKey] = null;
					instance.component.props.setModifierTray = () => void 0;
				},
			},
		},
	);
}

type MessageCheckComponent = ReactExtended.WritableComponent<
	{
		setModifierTray: (o: object) => void;
	},
	{
		lastSentMessage: string | null;
		lastSentTimestamp: number | null;
	}
>;

defineExpose({
	component: AutocompleteProvider,
	setTray: null as Twitch.ChatAutocompleteComponent["props"]["setTray"] | null,
	setModifierTray: null as Twitch.ChatAutocompleteComponent["props"]["setModifierTray"] | null,
	clearModifierTray: null as Twitch.ChatAutocompleteComponent["props"]["clearModifierTray"] | null,
});

markAsReady();
</script>
