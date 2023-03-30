<template />

<script setup lang="ts">
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatMessages } from "@/composable/chat/useChatMessages";

const props = defineProps<{
	channelId: string;
}>();

const ctx = useChannelContext(props.channelId);
const messages = useChatMessages(ctx);

messages.target.addEventListener("message", () => {
	// do stuff here...
});
</script>
