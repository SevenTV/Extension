<template>
	<template v-if="shallowList">
		<ChatObserver :list-element="shallowList" />
	</template>

	<ChatData />
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { ObserverPromise, ObserverPromiseNotResolvedError } from "@/common/Async";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import ChatObserver from "./ChatObserver.vue";
import ChatData from "@/app/chat/ChatData.vue";

const props = defineProps<{
	channelId: string;
	slug: string;
}>();

const ctx = useChannelContext(props.channelId, true);

// The list
const chatList = ref<HTMLDivElement | null>(null);
const shallowList = ref<HTMLDivElement | null>(null);

let observer: ObserverPromise<HTMLDivElement> | null = null;

watchEffect((onCleanup) => {
	let cancelled = false;

	const disconnectObserver = () => {
		if (!observer) return;

		observer.disconnect();
		observer = null;
	};

	onCleanup(() => {
		cancelled = true;
		disconnectObserver();
	});

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
	if (!(chatroomTop instanceof HTMLDivElement)) return;

	const currentList = chatroomTop.firstElementChild;
	chatList.value = currentList instanceof HTMLDivElement && currentList.isConnected ? currentList : null;

	// Create observer
	disconnectObserver();
	if (!(currentList instanceof HTMLDivElement)) {
		const pendingObserver = new ObserverPromise<HTMLDivElement>(
			(records, emit) => {
				for (const rec of records) {
					if (!rec.target || !(rec.target instanceof HTMLDivElement)) continue;
					if (!rec.target.firstElementChild) continue;
					if (!(rec.target.firstElementChild instanceof HTMLDivElement)) continue;

					emit(rec.target.firstElementChild as HTMLDivElement);
				}
			},
			chatroomTop,
			{
				childList: true,
				subtree: true,
			},
		);
		observer = pendingObserver;

		void pendingObserver
			.then((el) => {
				if (cancelled || observer !== pendingObserver) return;

				observer = null;

				const currentChatroomTop = document.getElementById("chatroom-messages");
				if (currentChatroomTop !== chatroomTop) return;
				if (!el.isConnected || !chatroomTop.contains(el)) return;

				chatList.value = el;
				shallowList.value = el;
			})
			.catch((err) => {
				if (err instanceof ObserverPromiseNotResolvedError) return;
				throw err;
			});
	} else {
		shallowList.value = currentList;
	}
});
</script>
