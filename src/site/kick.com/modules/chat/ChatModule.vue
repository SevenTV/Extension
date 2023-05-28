<template>
	<template v-if="chan.active">
		<Suspense>
			<ChatController ref="controller" :slug="chan.slug" />
		</Suspense>
	</template>
</template>

<script setup lang="ts">
import { provide, reactive, ref, watch } from "vue";
import { defineFunctionHook } from "@/common/Reflection";
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
type chatroomWithActions = typeof chatroomStore & {
	sendCurrentMessage: () => void;
};

const controller = ref<InstanceType<typeof ChatController> | null>(null);

const chan = reactive<KickChannelInfo>({
	active: false,
	slug: "",
	currentMessage: "",
});

provide(KICK_CHANNEL_KEY, chan);

if (chatroomStore) {
	chatroomStore.$subscribe(async (_, s: ChatRoom) => {
		if (!s.chatroom || typeof s.chatroom.id !== "number") return;

		if (chan.slug !== s.currentChannelSlug) {
			chan.active = false;
			await new Promise((r) => setTimeout(r, 250));
			chan.active = true;
		}

		chan.slug = s.currentChannelSlug;
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

	defineFunctionHook(chatroomStore as chatroomWithActions, "sendCurrentMessage", function (this, ...args) {
		const f = args[0];

		if (controller.value) {
			controller.value.onMessageSend();
		}

		return f?.apply(this, []);
	});
}

markAsReady();
</script>
