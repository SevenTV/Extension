<template>
	<template v-for="[key, bind] of messageMap" :key="key">
		<ChatMessageVue :bind="bind" />
	</template>
</template>

<script setup lang="ts">
import { reactive, watchEffect } from "vue";
import { useMutationObserver } from "@vueuse/core";
import ChatMessageVue, { ChatMessageBinding } from "./ChatMessage.vue";

const props = defineProps<{
	listElement: HTMLDivElement;
}>();

const messageMap = reactive(new Map<string, ChatMessageBinding>());

function patchMessageElement(el: HTMLDivElement): void {
	if (!el.hasAttribute("data-chat-entry")) return; // not a message

	const entryID = el.getAttribute("data-chat-entry")!;

	const identity = el.querySelector<HTMLSpanElement>(".chat-message-identity");
	if (!identity) return; // missing identity

	const entryUser = identity.querySelector(".chat-entry-username");
	if (!entryUser) return; // missing username

	const userID = entryUser.getAttribute("data-chat-entry-user-id");
	const username = entryUser.getAttribute("data-chat-entry-user");
	if (!userID || !username) return; // missing user ID or username

	// find all untokenized content
	const texts = el.querySelectorAll<HTMLSpanElement>(".chat-entry-content");

	const bind: ChatMessageBinding = {
		id: entryID,
		authorID: userID,
		authorName: username,
		texts: Array.from(texts),
	};

	messageMap.set(entryID, bind);
}

function patchCurrentElements(): void {
	const entries = props.listElement.querySelectorAll("[data-chat-entry]");
	for (const el of Array.from(entries)) {
		patchMessageElement(el as HTMLDivElement);
	}
}

watchEffect(patchCurrentElements);

useMutationObserver(
	props.listElement,
	(records) => {
		for (const rec of records) {
			rec.addedNodes.forEach((n) => (n instanceof HTMLDivElement ? patchMessageElement(n) : null));
			rec.removedNodes.forEach((n) =>
				n instanceof HTMLDivElement ? messageMap.delete(n.getAttribute("data-chat-entry")!) : null,
			);
		}
	},
	{ childList: true },
);
</script>
