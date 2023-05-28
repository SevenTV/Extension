<template>
	<template v-if="chan.id && chan.username">
		<ChatController />
	</template>
</template>

<script setup lang="ts">
import { provide, ref } from "vue";
import { reactive } from "vue";
import { watch } from "vue";
import { log } from "@/common/Logger";
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

const chatroomID = ref("");
const chan = reactive<KickChannelInfo>({
	id: "",
	username: "",
	currentMessage: "",
});

provide(KICK_CHANNEL_KEY, chan);

if (chatroomStore) {
	chatroomStore.$subscribe(async (_, s: ChatRoom) => {
		if (!s.chatroom || typeof s.chatroom.id !== "number") return;
		if (chatroomID.value && chatroomID.value === s.chatroom.id.toString()) return;

		chatroomID.value = s.chatroom.id.toString();

		// need to fetch the channel because we can only get the chatroom ID from this which isn't equal to the user ID
		const resp = await fetch(`https://kick.com/api/v2/channels/${s.currentChannelSlug}`).catch((err) => {
			log.error("failed to fetch channel data", err);
		});
		if (!resp) return;

		const { user_id: id } = await resp.json();
		if (!id) return;

		chan.id = id.toString();
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
