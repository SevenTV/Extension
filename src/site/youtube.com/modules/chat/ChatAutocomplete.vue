<template />

<script setup lang="ts">
import { ref, watch, watchEffect } from "vue";
import { defineFunctionHook, unsetPropertyHook } from "@/common/Reflection";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";

const props = defineProps<{
	w: Window;
}>();

const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);

const InputFieldRenderer = ref<CustomElementConstructor | null>(null);
const inputField = ref<YouTube.LiveChatTextInputFieldRenderer | null>(null);

// Create a list of all emotes
const emoteList = ref<SevenTV.ActiveEmote[]>([]);
watch(emotes.active, () => {
	emoteList.value = [
		...[emotes.byProvider("7TV"), emotes.byProvider("BTTV"), emotes.byProvider("FFZ")].flatMap((es) =>
			Object.values(es).flatMap((es) => es.emotes),
		),
	];
});

watchEffect(async () => {
	InputFieldRenderer.value = await props.w.customElements.whenDefined("yt-live-chat-text-input-field-renderer");
	if (!InputFieldRenderer.value) return;

	inputField.value = new InputFieldRenderer.value() as YouTube.LiveChatTextInputFieldRenderer;
});

watch(
	inputField,
	(inp, old) => {
		if (old) {
			unsetPropertyHook(old, "getSuggestions");
		}
		if (!inp) return;

		defineFunctionHook(inp.constructor.prototype, "getSuggestions", function (this, old, term: string) {
			const result = old?.apply(this, [term]) as { suggestion: YouTube.ChatSuggestion }[];
			if (!result || !Array.isArray(result)) return;

			// Filter to term
			const query = term.toLowerCase().slice(1);
			const emotes = emoteList.value.filter((ae) => ae.name.toLowerCase().includes(query));

			result.push(
				...emotes.map((e) => ({
					suggestion: {
						alt: e.name,
						emoji: true,
						text: e.name,
						textToInsertWhenSelected: e.name,
						image: {
							accessibility: {
								accessibilityData: {
									label: e.name,
								},
							},
							thumbnails: e.data?.host.files
								.filter((f) => f.format === e.data!.host.files[0].format)
								.map((f) => ({
									url: `${e.data!.host.url}/${f.name}`,
									width: f.width,
									height: f.height,
								})),
						},
					} as YouTube.ChatSuggestion,
				})),
			);

			return result;
		});
	},
	{ immediate: true },
);
</script>
