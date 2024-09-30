<template>
	<template v-if="shallowList">
		<ChatObserver :list-element="shallowList" />
		<ChatAutocomplete ref="autocomplete" />
	</template>

	<ChatData />
</template>

<script setup lang="ts">
import { ref, toRaw, watchEffect } from "vue";
import { ObserverPromise } from "@/common/Async";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useWorker } from "@/composable/useWorker";
import ChatAutocomplete from "./ChatAutocomplete.vue";
import ChatObserver from "./ChatObserver.vue";
import ChatData from "@/app/chat/ChatData.vue";

const props = defineProps<{
	channelId: string;
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

const ctx = useChannelContext(props.channelId, true);
const { sendMessage: sendWorkerMessage } = useWorker();

// The list
const chatList = ref<HTMLDivElement | null>(null);
const shallowList = ref<HTMLDivElement | null>(null);

const autocomplete = ref<InstanceType<typeof ChatAutocomplete> | null>(null);

let observer: ObserverPromise<HTMLDivElement> | null = null;

watchEffect(async () => {
	// Update channel context
	const ok = ctx.setCurrentChannel({
		id: props.channelId,
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
	const chatroomTop = document.getElementById("chatroom-messages");
	if (!chatroomTop) return;

	chatList.value = chatroomTop.firstElementChild as HTMLDivElement;

	// Create observer
	if (observer) observer.disconnect();
	if (!chatroomTop.firstElementChild) {
		observer = new ObserverPromise<HTMLDivElement>(
			(records, emit) => {
				for (const rec of records) {
					if (!rec.target || !(rec.target instanceof HTMLDivElement)) continue;
					if (!rec.target.firstElementChild) continue;

					emit(rec.target.firstElementChild as HTMLDivElement);
				}
			},
			chatroomTop,
			{
				childList: true,
				subtree: true,
			},
		);

		const el = await observer;
		shallowList.value = el;
	} else {
		shallowList.value = chatroomTop.firstElementChild as HTMLDivElement;
	}
});
</script>
