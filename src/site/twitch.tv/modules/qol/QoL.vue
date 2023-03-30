<template />

<script setup lang="ts">
import { nextTick, onUnmounted } from "vue";
import { EmoteToken } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { ChatEvent } from "@/composable/chat/useChatMessages";

const props = defineProps<{
	channelId: string;
}>();

const ctx = useChannelContext(props.channelId);
const messages = useChatMessages(ctx);

const activeSounds = new Set<string>();

function onEmote(ae: SevenTV.ActiveEmote) {
	if (!ae.data || !ae.data.dank_file_url || activeSounds.has(ae.id)) return;

	const aud = new Audio(ae.data.dank_file_url);
	aud.play().catch(() => void 0);

	activeSounds.add(ae.id);
	aud.addEventListener("ended", () => {
		activeSounds.delete(ae.id);
	});
}

function onMessage(ev: ChatEvent<"message">): void {
	nextTick(() => {
		for (const tok of ev.detail.tokens) {
			if (tok.kind !== "EMOTE") continue;

			onEmote((tok as EmoteToken).content.emote);
		}
	});
}

messages.target.addEventListener("message", onMessage);

onUnmounted(() => {
	messages.target.removeEventListener("message", onMessage);
});
</script>
