<template />
<script setup lang="ts">
import { onUnmounted } from "vue";
import { useChannelContext } from "@/composable/channel/useChannelContext";

const info = c.instance.chatController.instances[0].component.props;
const ctx = useChannelContext(info.channelID);

const props = defineProps<{
	add: (c: Twitch.ChatCommand) => void;
	remove: (c: Twitch.ChatCommand) => void;
}>();

const handler: Twitch.ChatCommand.Handler = () => {
	return {
		deferred: async () => {
			ctx.setCurrentChannel(ctx.base());
		},
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
