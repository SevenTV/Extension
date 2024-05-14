<template />
<script setup lang="ts">
import { onUnmounted } from "vue";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatMessages } from "@/composable/chat/useChatMessages";

const ctx = useChannelContext();

const props = defineProps<{
	add: (c: Twitch.ChatCommand) => void;
	remove: (c: Twitch.ChatCommand) => void;
}>();

const { reload } = useChatMessages(ctx);

const doRefresh = async () => {
	await ctx.fetch(true);
	reload();
	return { notice: "Emotes refreshed" };
};

const handler: Twitch.ChatCommand.Handler = () => {
	return {
		deferred: doRefresh(),
	};
};

const command: Twitch.ChatCommand = {
	name: "refresh",
	description: "Refresh chat emotes",
	helpText: "Refresh chat emotes",
	permissionLevel: 0,
	handler: handler,
	group: "7TV",
};

props.add(command);
onUnmounted(() => props.remove(command));
</script>
