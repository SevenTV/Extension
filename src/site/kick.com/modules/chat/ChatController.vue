<template>
	<template v-if="shallowList">
		<ChatObserver :list-element="shallowList" />
		<ChatAutocomplete />
	</template>
	<ChatData />
</template>

<script setup lang="ts">
import { inject, watchEffect } from "vue";
import { ref } from "vue";
import { watch } from "vue";
import { toRefs } from "vue";
import { ObserverPromise } from "@/common/Async";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import ChatData from "@/site/youtube.com/modules/chat/ChatData.vue";
import ChatAutocomplete from "./ChatAutocomplete.vue";
import ChatObserver from "./ChatObserver.vue";
import { KICK_CHANNEL_KEY } from "../..";

const { id: channelID, username: channelUsername } = toRefs(
	inject(KICK_CHANNEL_KEY, { id: "", username: "", currentMessage: "" }),
);

const ctx = useChannelContext(channelID.value, true);

// The list
const chatList = ref<HTMLDivElement | null>(null);
const shallowList = ref<HTMLDivElement | null>(null);

watchEffect(async () => {
	// Update channel context
	const ok = ctx.setCurrentChannel({
		id: channelID.value,
		username: channelUsername.value,
		displayName: channelUsername.value,
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

	// The adjacent element is expected to be the chat's message list
	chatList.value = chatroomTop.nextElementSibling as HTMLDivElement;
});

// Watch for message list updates
watch(
	chatList,
	async (el) => {
		if (!el) return;

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
