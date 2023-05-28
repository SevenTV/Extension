<template>
	<template v-if="shallowList">
		<ChatObserver :list-element="shallowList" />
		<ChatAutocomplete />
	</template>
	<ChatData />
</template>

<script setup lang="ts">
import { inject, ref, toRefs, watchEffect } from "vue";
import { ObserverPromise } from "@/common/Async";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import ChatData from "@/site/twitch.tv/modules/chat/ChatData.vue";
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

let observer: ObserverPromise<HTMLDivElement> | null = null;

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
