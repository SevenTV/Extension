<template>
	<div v-for="msg of messages" :key="msg.id" :msg-id="msg.id">
		<template v-if="msg.seventv">
			<ChatMessage :msg="msg" @open-viewer-card="openViewerCard" />
		</template>
		<template v-else>
			<ChatMessageUnhandled :msg="msg" />
		</template>
	</div>
</template>

<script setup lang="ts">
import ChatMessage from "@/site/twitch.tv/modules/chat/components/ChatMessage.vue";
import ChatMessageUnhandled from "./ChatMessageUnhandled.vue";

const props = defineProps<{
	controller: Twitch.ChatControllerComponent | undefined;
	messages: Twitch.ChatMessage[];
}>();

const openViewerCard = (ev: MouseEvent, viewer: Twitch.ChatUser) => {
	if (!props.controller) return;

	props.controller.sendMessage(`/user ${viewer.userLogin}`);

	// Watch for card being created
	const userCardContainer = document.querySelector("[data-a-target='chat-user-card']");
	if (!userCardContainer) return;

	const observer = new MutationObserver(() => {
		// Find card element
		const cardEl = document.querySelector<HTMLDivElement>("[data-test-selector='viewer-card-positioner']");
		if (!cardEl) return;

		cardEl.style.top = `${ev.y - cardEl.getBoundingClientRect().height}px`;
		observer.disconnect();
		clearTimeout(timeout);
	});

	observer.observe(userCardContainer, {
		childList: true,
		subtree: true,
	});

	// timeout the mutation observer
	const timeout = setTimeout(() => {
		observer.disconnect();
	}, 30000);
};
</script>
