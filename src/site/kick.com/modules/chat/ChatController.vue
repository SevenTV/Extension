<template>
	<template v-if="shallowList">
		<ChatObserver :list-element="shallowList" />
		<ChatAutocomplete ref="autocomplete" />
	</template>

	<ChatData />
	<ChatEmoteMenu @pick-emote="(ae) => insertToInput(ae.provider === 'EMOJI' ? ae.unicode ?? ae.name : ae.name)" />
</template>

<script setup lang="ts">
import { ref, toRaw, watchEffect } from "vue";
import { ObserverPromise } from "@/common/Async";
import { log } from "@/common/Logger";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useWorker } from "@/composable/useWorker";
import ChatAutocomplete from "./ChatAutocomplete.vue";
import ChatEmoteMenu from "./ChatEmoteMenu.vue";
import ChatObserver from "./ChatObserver.vue";
import ChatData from "@/app/chat/ChatData.vue";

const props = defineProps<{
	slug: string;
}>();

defineExpose({
	onMessageSend,
});

function onMessageSend(text: string) {
	sendWorkerMessage("CHANNEL_ACTIVE_CHATTER", {
		channel: toRaw(ctx),
	});

	autocomplete.value?.handleMessageSend(text);
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

const autocomplete = ref<InstanceType<typeof ChatAutocomplete> | null>(null);

function insertToInput(value: string): void {
	if (!autocomplete.value) return;

	autocomplete.value.insertAtEnd(value);
}

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
