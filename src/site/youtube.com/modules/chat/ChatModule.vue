<template>
	<template v-if="chatList && channelID">
		<ChatController :w="w" :chat-list="chatList" :channel-id="channelID" />
	</template>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useIntervalFn } from "@vueuse/core";
import { decodeYoutubeParams } from "@/common/Decode";
import { declareModule } from "@/composable/useModule";
import ChatController from "./ChatController.vue";

const { markAsReady } = declareModule("chat", {
	name: "Chat",
	depends_on: [],
});

const channelID = ref("");
const w = ref(window);
const ChatList = ref<CustomElementConstructor | null>(null);
const chatList = ref<YouTube.LiveChatItemListRenderer | null>(null);
const ChatInput = ref<CustomElementConstructor | null>(null);

useIntervalFn(
	async () => {
		const frames = window.frames as unknown as Record<string, HTMLIFrameElement | undefined>;

		const f = frames["chatframe"];

		w.value = (f ? f.contentWindow : window) as Window & typeof globalThis;
		ChatList.value = await w.value.customElements.whenDefined("yt-live-chat-item-list-renderer");
		ChatInput.value = await w.value.customElements.whenDefined("yt-live-chat-message-input-renderer");
	},
	1e3,
	{
		immediateCallback: true,
	},
);

async function captureChannelId(w: Window): Promise<void> {
	const input = w.document.querySelector<YouTube.LiveChatMessageInputRenderer>("yt-live-chat-message-input-renderer");
	if (!input) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const yt = (w as any).yt;

		channelID.value = yt?.config_?.CHANNEL_ID ?? "";
		return;
	}

	const params = input.data.sendButton.buttonRenderer.serviceEndpoint.sendLiveChatMessageEndpoint.params;
	const decoded = decodeYoutubeParams(params);

	channelID.value = decoded;
}

watchEffect(() => {
	if (!w.value) return;
	if (!ChatList.value) return;

	chatList.value = new ChatList.value() as YouTube.LiveChatItemListRenderer;

	// Apply stylesheet to frame
	const sheets = window.document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>(
		"#seventv-stylesheet, [data-vite-dev-id]",
	);

	// if inside an iframe we must port styles to it
	if (sheets.length && w.value.frameElement) {
		sheets.forEach((sheet) => {
			let x: HTMLLinkElement | HTMLStyleElement | undefined;

			switch (sheet.tagName) {
				// in dev mode we apply vite's generated stylesheets
				case "STYLE": {
					if (!sheet.dataset.viteDevId) break;

					const style = (x = document.createElement("style"));
					style.appendChild(document.createTextNode(sheet.innerHTML));

					break;
				}
				// in prod mode we apply the single-file stylesheet from the main document
				case "LINK": {
					if (sheet.id !== "seventv-stylesheet") break;

					const link = (x = document.createElement("link"));
					link.rel = "stylesheet";
					link.href = (sheet as HTMLLinkElement).href;
					link.id = sheet.id;
					break;
				}
			}
			if (!x) return;

			w.value.document.head.appendChild(x);
		});
	}

	captureChannelId(w.value);
});

markAsReady();
</script>
