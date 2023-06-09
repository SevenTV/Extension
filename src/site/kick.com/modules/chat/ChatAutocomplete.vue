<template />

<script setup lang="ts">
import { inject, ref, toRef, watch, watchEffect } from "vue";
import { useEventListener } from "@vueuse/core";
import { useStore } from "@/store/main";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useCosmetics } from "@/composable/useCosmetics";
import { KICK_CHANNEL_KEY } from "@/site/kick.com";

export interface TabToken {
	token: string;
	priority: number;
	item?: SevenTV.ActiveEmote;
}

const info = inject(KICK_CHANNEL_KEY);
if (!info) throw new Error("Could not retrieve channel info");

const { identity } = useStore();
const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);
const cosmetics = useCosmetics(identity?.id ?? "");

const currentMessage = toRef(info, "currentMessage");
const inputEl = ref<HTMLDivElement | null>(null);

function renderInputTokens(): void {
	if (!inputEl.value) return;

	inputEl;
}

function insertAtEnd(value: string): void {
	if (!inputEl.value || typeof inputEl.value.textContent !== "string") return;

	inputEl.value.textContent += inputEl.value.textContent.charAt(value.length - 1) === " " ? value : ` ${value}`;
	if (info) info.currentMessage = inputEl.value.textContent;
}

function handleTab(n: Text, sel: Selection): void {
	const { anchorOffset, focusOffset } = sel;

	const start = Math.min(anchorOffset, focusOffset);
	const end = Math.max(anchorOffset, focusOffset);

	const text = n.textContent ?? "";
	const tokenStart = text.substring(0, focusOffset).lastIndexOf(" ", focusOffset);

	const searchWord = text.substring(tokenStart + 1, start);
	if (!searchWord) return;

	const emote = [...Object.values(emotes.active), ...Object.values(cosmetics.emotes)].find((ae) =>
		ae.name.toLowerCase().startsWith(searchWord.toLowerCase()),
	);
	if (!emote || emote.provider === "EMOJI") return;

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
	inputEl.value = (document.getElementById("message-input") as HTMLDivElement) ?? null;
});

defineExpose({
	insertAtEnd,
});
</script>
