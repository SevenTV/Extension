<template>
	<template v-if="shallowList">
		<ChatObserver :list-element="shallowList" />
	</template>
	<ChatData />
</template>

<script setup lang="ts">
import { watchEffect } from "vue";
import { ref } from "vue";
import { watch } from "vue";
import { ObserverPromise } from "@/common/Async";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import ChatData from "@/site/youtube.com/modules/chat/ChatData.vue";
import ChatObserver from "./ChatObserver.vue";

const props = defineProps<{
	channelId: string;
	channelSlug: string;
}>();

const ctx = useChannelContext(props.channelId);

// The list
const chatList = ref<HTMLDivElement | null>(null);
const shallowList = ref<HTMLDivElement | null>(null);

watchEffect(async () => {
	// Update channel context
	const ok = ctx.setCurrentChannel({
		id: props.channelId,
		username: props.channelSlug,
		displayName: props.channelSlug,
	});
	if (ok) {
		chatList.value = null;
		shallowList.value = null;
	}

	// Find chatroom element
	// "chatroom-top" is the heading
	const chatroomTop = document.getElementById("chatroom-top");
	if (!chatroomTop || !chatroomTop.nextElementSibling) return;

	// The adjacent element is expected to be the chat's message list
	chatList.value = chatroomTop.nextElementSibling as HTMLDivElement;
});

// Watch for message list updates
watch(
	chatList,
	async (el, old) => {
		if (!el || (old && el === old)) return;

		// Obtain the shallow message list
		// This will be used to set up an efficient-ish mutation observer
		shallowList.value = await new ObserverPromise<HTMLDivElement>(
			(records, emit) => {
				for (const rec of records) {
					rec.addedNodes.forEach((n) => (n instanceof HTMLDivElement ? emit(n) : null));
				}
			},
			el,
			{ childList: true },
		);
	},
	{
		immediate: true,
	},
);
</script>
