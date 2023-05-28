<template>
	<template v-if="chan.id && chan.username">
		<ChatController />
	</template>
</template>

<script setup lang="ts">
import { provide } from "vue";
import { reactive } from "vue";
import { watch } from "vue";
import { declareModule } from "@/composable/useModule";
import { ChatRoom, KICK_CHANNEL_KEY, KickChannelInfo } from "@/site/kick.com";
import { useApp } from "@/site/kick.com/composable/useApp";
import { usePinia } from "@/site/kick.com/composable/usePinia";
import ChatController from "./ChatController.vue";

const { markAsReady } = declareModule<"KICK">("chat", {
	name: "Chat",
	depends_on: [],
});

// Acquire vue app
const app = useApp();
const chatroomStore = usePinia<ChatRoom>(app, "chatroomv2");

const chan = reactive<KickChannelInfo>({
	id: "",
	username: "",
	currentMessage: "",
});

provide(KICK_CHANNEL_KEY, chan);

if (chatroomStore) {
	chatroomStore.$subscribe((_, s: ChatRoom) => {
		if (!s.chatroom || typeof s.chatroom.id !== "number") return;

		chan.id = s.chatroom.id.toString();
		chan.username = s.currentChannelSlug;
		chan.currentMessage = s.currentMessage;
	});
	watch(
		() => chan.currentMessage,
		(v) => {
			chatroomStore?.$patch({
				currentMessage: v,
			});
		},
	);
}

markAsReady();
</script>
