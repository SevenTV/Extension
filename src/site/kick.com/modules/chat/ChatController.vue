<template>
	<template v-if="shallowList">
		<ChatObserver :list-element="shallowList" />
		<ChatAutocomplete />
	</template>
	<ChatData />
</template>

<script setup lang="ts">
import { ref, toRaw, watchEffect } from "vue";
import { ObserverPromise } from "@/common/Async";
import { log } from "@/common/Logger";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useWorker } from "@/composable/useWorker";
import ChatData from "@/site/twitch.tv/modules/chat/ChatData.vue";
import ChatAutocomplete from "./ChatAutocomplete.vue";
import ChatObserver from "./ChatObserver.vue";

const props = defineProps<{
	slug: string;
}>();

defineExpose({
	onMessageSend,
});

function onMessageSend() {
	sendWorkerMessage("CHANNEL_ACTIVE_CHATTER", {
		channel: toRaw(ctx),
	});
}

// need to fetch the channel because we can only get the chatroom ID from this which isn't equal to the user ID
const resp = await fetch(`https://kick.com/api/v2/channels/${props.slug}`).catch((err) => {
	log.error("failed to fetch channel data", err);
});
if (!resp) throw new Error("failed to fetch channel data");

const { user_id: id } = await resp.json();
if (!id) throw new Error("failed to get channel ID");

const ctx = useChannelContext(id.toString(), true);
const { sendMessage: sendWorkerMessage } = useWorker();

// The list
const chatList = ref<HTMLDivElement | null>(null);
const shallowList = ref<HTMLDivElement | null>(null);

let observer: ObserverPromise<HTMLDivElement> | null = null;

watchEffect(async () => {
	// Update channel context
	const ok = ctx.setCurrentChannel({
		id: id.toString(),
		username: props.slug,
		displayName: props.slug,
		active: true,
	});
	if (ok) {
		chatList.value = null;
		shallowList.value = null;
	}

	// Find chatroom element
	// "chatroom-top" is the heading
	const chatroomTop = document.getElementById("chatroom-top");
	if (!chatroomTop || !chatroomTop.nextElementSibling) return;

	chatList.value = chatroomTop.nextElementSibling as HTMLDivElement;

	// Create observer
	if (observer) observer.disconnect();
	if (!chatroomTop.nextElementSibling.firstElementChild) {
		observer = new ObserverPromise<HTMLDivElement>(
			(records, emit) => {
				for (const rec of records) {
					if (!rec.target || !(rec.target instanceof HTMLDivElement)) continue;
					if (!rec.target.firstElementChild) continue;

					emit(rec.target.firstElementChild as HTMLDivElement);
				}
			},
			chatroomTop.nextElementSibling,
			{
				childList: true,
				subtree: true,
			},
		);

		const el = await observer;
		shallowList.value = el;
	} else {
		shallowList.value = chatroomTop.nextElementSibling.firstElementChild as HTMLDivElement;
	}
});
</script>
