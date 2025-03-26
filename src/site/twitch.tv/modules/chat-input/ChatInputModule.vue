<template>
	<template v-for="inst in autocompleteProvider.instances" :key="inst.identifier">
		<ChatInput v-if="shouldMount.get(inst)" :instance="inst" />
		<ChatSpam
			v-if="shouldMount.get(inst)"
			:instance="inst"
			:suggest="suggestBypassDuplicateCheck || false"
			@suggest-answer="onBypassSuggestionAnswer"
		/>
	</template>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { HookedInstance, useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import { declareConfig, useConfig } from "@/composable/useSettings";
import ChatInput from "./ChatInput.vue";
import ChatSpam from "./ChatSpam.vue";

const { markAsReady } = declareModule<"TWITCH">("chat-input", {
	name: "Chat Input",
	depends_on: [],
});

const shouldMount = reactive(new WeakMap<HookedInstance<Twitch.ChatAutocompleteComponent>, boolean>());
const shouldBypassDuplicateCheck = useConfig("chat_input.spam.bypass_duplicate");

const suggestBypassDuplicateCheck = ref<boolean | null>(null);

const autocompleteProvider = useComponentHook<Twitch.ChatAutocompleteComponent>(
	{
		parentSelector: ".chat-input__textarea",
		maxDepth: 50,
		predicate: (n) => n.providers,
	},
	{
		trackRoot: true,
		containerClass: "seventv-chat-input-textarea",
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
				return n.props?.setModifierTray && n.key === hc.key;
			},
		},
		{
			hooks: {
				update(instance) {
					switch (instance.component.key) {
						case "duplicated-messages":
							onDuplicatedMessage(instance.component);
							break;
					}

					if (!shouldBypassDuplicateCheck.value) return;

					if (hc.stateKey) instance.component.state[hc.stateKey] = null;
					instance.component.props.setModifierTray = () => void 0;
				},
			},
		},
	);
}

function onDuplicatedMessage(com: MessageCheckComponent): void {
	if (shouldBypassDuplicateCheck.value || suggestBypassDuplicateCheck.value === false) return; // already enabled
	if (!com.props.tray || com.props.tray.type !== "duplicated-message-error") {
		suggestBypassDuplicateCheck.value = null;
		return;
	}

	suggestBypassDuplicateCheck.value = true;
}

function onBypassSuggestionAnswer(answer: string): void {
	if (!answer) return;

	suggestBypassDuplicateCheck.value = false;

	switch (answer) {
		case "yes":
			shouldBypassDuplicateCheck.value = true;
			break;

		case "no":
			shouldBypassDuplicateCheck.value = false;
			break;
	}
}

type MessageCheckComponent = ReactExtended.WritableComponent<
	{
		setModifierTray: (o: object) => void;
		tray?: ReactExtended.ReactVNode;
	},
	{
		lastSentMessage: string | null;
		lastSentTimestamp: number | null;
	}
> & {
	key: "message-throughput" | "duplicated-messages";
};

defineExpose({
	component: autocompleteProvider,
	setTray: null as Twitch.ChatAutocompleteComponent["props"]["setTray"] | null,
	setModifierTray: null as Twitch.ChatAutocompleteComponent["props"]["setModifierTray"] | null,
	clearModifierTray: null as Twitch.ChatAutocompleteComponent["props"]["clearModifierTray"] | null,
});

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("chat_input.autocomplete.colon", "DROPDOWN", {
		path: ["Chat", "Autocompletion"],
		label: "Autocompletion",
		hint: "Enables a list of partially matching emotes when writing a message (Setting this to 'Always on' will disable the Tab-completion Carousel)",
		options: [
			["Disabled", 0],
			["Require the ':' prefix", 1],
			["Always on", 2],
		],
		transform(v) {
			return v === true ? 1 : 0;
		},
		defaultValue: 1,
	}),
	declareConfig("chat_input.autocomplete.colon.emoji", "TOGGLE", {
		path: ["Chat", "Autocompletion"],
		label: "Autocompletion: Emoji",
		disabledIf: () => useConfig("chat_input.autocomplete.colon").value === 0,
		hint: "Whether or not to also include emojis in the autocompletion list (This may impact performance)",
		defaultValue: false,
	}),
	declareConfig("chat_input.autocomplete.colon.mode", "DROPDOWN", {
		path: ["Chat", "Autocompletion"],
		label: "Autocompletion: Mode",
		disabledIf: () => useConfig("chat_input.autocomplete.colon").value === 0,
		hint: "What emotes should be displayed in the autocompletion list",
		options: [
			["Must start with input", 0],
			["Must include input", 1],
		],
		defaultValue: 1,
	}),
	declareConfig("chat_input.autocomplete.carousel", "TOGGLE", {
		path: ["Chat", "Autocompletion"],
		label: "Tab-completion Carousel",
		disabledIf: () => useConfig("chat_input.autocomplete.colon").value === 2,
		hint: "Show a carousel visualization of previous and next tab-completion matches",
		defaultValue: true,
	}),
	declareConfig("chat_input.autocomplete.carousel_arrow_keys", "TOGGLE", {
		path: ["Chat", "Autocompletion"],
		label: "Tab-completion Carousel: Arrow Keys",
		disabledIf: () =>
			!useConfig("chat_input.autocomplete.carousel").value ||
			useConfig("chat_input.autocomplete.colon").value === 2,
		hint: "Whether or not to allow using left/right arrow keys to navigate the tab-completion carousel",
		defaultValue: true,
	}),
	declareConfig("chat_input.autocomplete.carousel.mode", "DROPDOWN", {
		path: ["Chat", "Autocompletion"],
		label: "Tab-completion: Mode",
		disabledIf: () =>
			!useConfig("chat_input.autocomplete.carousel").value ||
			useConfig("chat_input.autocomplete.colon").value === 2,
		hint: "What emotes should be displayed in the tab-completion carousel",
		options: [
			["Must start with input", 0],
			["Must include input", 1],
		],
		defaultValue: 0,
	}),
	declareConfig("chat_input.autocomplete.chatters", "TOGGLE", {
		path: ["Chat", "Autocompletion"],
		label: "Autocomplete chatters",
		hint: "Whether or not to consider the usernames of active chatters when using tab-completion",
		defaultValue: true,
	}),
	declareConfig("chat_input.spam.bypass_duplicate", "TOGGLE", {
		path: ["Chat", "Typing"],
		label: "Bypass Duplicate Message Check",
		hint: "If enabled, you will be able to send the same message multiple times in a row",
		defaultValue: false,
	}),
	declareConfig("chat_input.spam.rapid_fire_send", "TOGGLE", {
		path: ["Chat", "Typing"],
		label: "Quick Send",
		hint: "If enabled, you can use the Ctrl+Enter shortcut to keep the current message in the input box after sending",
		defaultValue: true,
	}),
];
</script>
