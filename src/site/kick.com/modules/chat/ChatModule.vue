<template>
	<template v-if="channelID && channelSlug">
		<ChatController :channel-id="channelID" :channel-slug="channelSlug" />
	</template>
</template>

<script setup lang="ts">
import { App } from "vue";
import { ref } from "vue";
import { Pinia, _StoreWithState } from "pinia";
import { declareModule } from "@/composable/useModule";
import { ChatRoom } from "@/site/kick.com";
import ChatController from "./ChatController.vue";

const { markAsReady } = declareModule("chat", {
	name: "Chat",
	depends_on: [],
});

// Acquire vue app
const app = (document.querySelector("#app") as unknown as Record<string, never>)?.__vue_app__ as App<Element>;
if (!app) throw new Error("Could not acquire vue app");

// Acquire pinia instance
const pinia = app.config.globalProperties.$pinia;
const stores = (pinia as Pinia & { _s: Map<string, _StoreWithState<"ANY-KICK-STORE", ChatRoom, unknown, unknown>> })[
	"_s"
];

const channelID = ref<string | null>(null);
const channelSlug = ref<string | null>(null);

for (const [key, store] of stores.entries()) {
	if (key !== "chatroomv2") continue;

	store.$subscribe((_, s) => {
		if (!s.chatroom || typeof s.chatroom.id !== "number") return;

		channelID.value = s.chatroom.id.toString();
		channelSlug.value = s.currentChannelSlug;
	});
}

markAsReady();
</script>
