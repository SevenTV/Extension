<template>
	<Teleport :to="container"> </Teleport>
</template>

<script setup lang="ts">
import { inject, ref, toRef, watch, watchEffect } from "vue";
import { useEventListener } from "@vueuse/core";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { KICK_CHANNEL_KEY } from "@/site/kick.com";

export interface TabToken {
	token: string;
	priority: number;
	item?: SevenTV.ActiveEmote;
}

const info = inject(KICK_CHANNEL_KEY);
if (!info) throw new Error("Could not retrieve channel info");

const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);

const currentMessage = toRef(info, "currentMessage");

const container = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLDivElement | null>(null);

function renderInputTokens(): void {
	if (!inputEl.value) return;

	inputEl;
}

function handleTab(n: Text, sel: Selection): void {
	const { anchorOffset, focusOffset } = sel;

	const start = Math.min(anchorOffset, focusOffset);
	const end = Math.max(anchorOffset, focusOffset);

	const text = n.textContent ?? "";
	const tokenStart = text.substring(0, focusOffset).lastIndexOf(" ", focusOffset);

	const searchWord = text.substring(tokenStart + 1, start);
	if (!searchWord) return;

	const emote = emotes.find((ae) => ae.name.toLowerCase().startsWith(searchWord.toLowerCase()));
	if (!emote) return;

	const textNode = document.createTextNode(`${emote.name} `);

	const range = document.createRange();
	range.setStart(n, start - searchWord.length);
	range.setEnd(n, end);
	range.deleteContents();
	range.insertNode(textNode);

	sel.collapse(textNode, emote.name.length + 1);
}

watch(currentMessage, renderInputTokens);

useEventListener(inputEl, "keydown", (ev: KeyboardEvent) => {
	const sel = document.getSelection();
	if (!sel) return;

	const n = sel.focusNode as Text | null;
	if (!n || n.nodeName !== "#text") return;

	switch (ev.key) {
		case "Tab":
			ev.preventDefault();
			handleTab(n, sel);
			break;
	}
});

watchEffect(() => {
	const footer = document.getElementById("chatroom-footer");
	if (!footer) return;

	const el = document.createElement("seventv-container");
	el.id = "seventv-autocomplete-container";

	footer.insertAdjacentElement("afterbegin", el);

	container.value = el;
	inputEl.value = (document.getElementById("message-input") as HTMLDivElement) ?? null;
});
</script>
