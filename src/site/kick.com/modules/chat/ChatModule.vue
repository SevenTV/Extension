<template>
	<template v-if="chan.id && chan.username">
		<ChatController />
	</template>
</template>

<script setup lang="ts">
import { App } from "vue";
import { provide } from "vue";
import { reactive } from "vue";
import { watch } from "vue";
import type { Pinia, _StoreWithState } from "pinia";
import { declareModule } from "@/composable/useModule";
import { ChatRoom, KICK_CHANNEL_KEY, KickChannelInfo } from "@/site/kick.com";
import ChatController from "./ChatController.vue";

const { markAsReady } = declareModule<"KICK">("chat", {
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

const chan = reactive<KickChannelInfo>({
	id: "",
	username: "",
	currentMessage: "",
});

provide(KICK_CHANNEL_KEY, chan);

for (const [key, store] of stores.entries()) {
	if (key !== "chatroomv2") continue;

	store.$subscribe((_, s) => {
		if (!s.chatroom || typeof s.chatroom.id !== "number") return;

		chan.id = s.chatroom.id.toString();
		chan.username = s.currentChannelSlug;
		chan.currentMessage = s.currentMessage;
	});
}

watch(
	() => chan.currentMessage,
	(v) => {
		const store = stores.get("chatroomv2");

		store?.$patch({
			currentMessage: v,
		});
	},
);

markAsReady();
</script>
