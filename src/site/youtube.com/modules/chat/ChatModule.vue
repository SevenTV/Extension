<template>
	<template v-if="chatList && channelID">
		<ChatController :chat-list="chatList" :channel-id="channelID" />
	</template>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { decodeYoutubeParams } from "@/common/Decode";
import { declareModule } from "@/composable/useModule";
import ChatController from "./ChatController.vue";

const { markAsReady } = declareModule("chat", {
	name: "Chat",
	depends_on: [],
});

const channelID = ref("");

const ChatList = await customElements.whenDefined("yt-live-chat-item-list-renderer");

const chatList = new ChatList() as YouTube.LiveChatItemListRenderer;

async function captureChannelId(): Promise<void> {
	await customElements.whenDefined("yt-live-chat-message-input-renderer");
	const input = document.querySelector<YouTube.LiveChatMessageInputRenderer>("yt-live-chat-message-input-renderer");
	if (!input) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const yt = (window as any).yt;

		channelID.value = yt?.config_?.CHANNEL_ID ?? "";
		return;
	}

	const params = input.data.sendButton.buttonRenderer.serviceEndpoint.sendLiveChatMessageEndpoint.params;
	const decoded = decodeYoutubeParams(params);

	channelID.value = decoded;
}

captureChannelId();

markAsReady();
</script>
