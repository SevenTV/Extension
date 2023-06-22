<template>
	<template v-if="chan.active">
		<Suspense>
			<ChatController ref="controller" :slug="chan.slug" />
		</Suspense>
	</template>
</template>

<script setup lang="ts">
import { onMounted, provide, reactive, ref, watch } from "vue";
import { noop, useEventListener } from "@vueuse/core";
import { defineFunctionHook } from "@/common/Reflection";
import { declareModule } from "@/composable/useModule";
import { ChatRoom, KICK_CHANNEL_KEY, KickChannelInfo } from "@/site/kick.com";
import { useApp } from "@/site/kick.com/composable/useApp";
import { usePinia } from "@/site/kick.com/composable/usePinia";
import { useRouter } from "@/site/kick.com/composable/useRouter";
import ChatController from "./ChatController.vue";
import { declareConfig } from "@/composable/useSettings";

const { markAsReady } = declareModule<"KICK">("chat", {
	name: "Chat",
	depends_on: [],
});

// Acquire vue app
const app = useApp();
const router = useRouter(app);

const controller = ref<InstanceType<typeof ChatController> | null>(null);

const chan = reactive<KickChannelInfo>({
	active: false,
	slug: "",
	currentMessage: "",
});

provide(KICK_CHANNEL_KEY, chan);

let ok = false;
const stoppers: (typeof noop)[] = [];
function handle(): void {
	if (ok) return;

	const chatroomStore = usePinia<ChatRoom>(app, "chatroomv2");
	type chatroomWithActions = typeof chatroomStore & {
		sendCurrentMessage: () => void;
	};
	if (!chatroomStore) return;

	ok = true;

	while (stoppers.length) stoppers.pop()?.();
	stoppers.push(
		chatroomStore.$subscribe(async (_, s: ChatRoom) => {
			if (!s.chatroom || typeof s.chatroom.id !== "number") return;

			if (chan.slug !== s.currentChannelSlug) {
				chan.active = false;
				await new Promise((r) => setTimeout(r, 250));
				chan.active = true;
				ok = false;
			}

			chan.slug = s.currentChannelSlug;
			chan.currentMessage = s.currentMessage;
		}),
	);

	stoppers.push(
		watch(
			() => chan.currentMessage,
			(v) => {
				chatroomStore?.$patch({
					currentMessage: v,
				});
			},
		),
	);

	defineFunctionHook(chatroomStore as chatroomWithActions, "sendCurrentMessage", function (this, ...args) {
		const f = args[0];

		if (controller.value) {
			controller.value.onMessageSend(this.$state.currentMessage);
		}

		return f?.apply(this, []);
	});
}

onMounted(() => {
	handle();
});

watch(() => router.currentRoute, handle, { immediate: true });
useEventListener(document, "click", () => setTimeout(handle, 250));

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("chat.test", "TOGGLE", {
		label: "Test",
		path: ["Chat", ""],
		defaultValue: false,
	}),
];
</script>
