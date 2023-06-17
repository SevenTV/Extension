<template>
	<!-- Patch messages -->
	<template v-for="[key, bind] of messageMap" :key="key">
		<ChatMessageVue :bind="bind" @open-card="onOpenUserCard" @vue:updated="onMessageRendered" />
	</template>

	<!-- Modify user card -->
	<template v-for="x of userCard" :key="x.el">
		<ChatUserCard :el="x.el" :bind="x.bind" />
	</template>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, watchEffect } from "vue";
import { useMutationObserver } from "@vueuse/core";
import { ObserverPromise } from "@/common/Async";
import ChatMessageVue, { ChatMessageBinding } from "./ChatMessage.vue";
import ChatUserCard from "./ChatUserCard.vue";

interface ActiveUserCard {
	bind: ChatMessageBinding;
	el: HTMLDivElement;
}

const props = defineProps<{
	listElement: HTMLDivElement;
}>();

const messageMap = reactive(new Map<string, ChatMessageBinding>());
const userCard = ref<ActiveUserCard[]>([]);

function patchMessageElement(el: HTMLDivElement): void {
	if (!el.hasAttribute("data-chat-entry")) return; // not a message

	const entryID = el.getAttribute("data-chat-entry")!;

	const identity = el.querySelector<HTMLSpanElement>(".chat-message-identity");
	if (!identity) return; // missing identity

	const entryUser = identity.querySelector<HTMLSpanElement>(".chat-entry-username");
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
		usernameEl: entryUser,
		el,
	};

	messageMap.set(entryID, bind);
}

async function onOpenUserCard(bind: ChatMessageBinding) {
	const parent = document.getElementById("chatroom");
	if (!parent) return;

	let el = parent.querySelector<HTMLDivElement>(".user-profile");
	if (!el) {
		el = await new ObserverPromise<HTMLDivElement>(
			(records, emit) => {
				for (const rec of records) {
					rec.addedNodes.forEach((n) => {
						if (!(n instanceof HTMLDivElement)) return;
						if (!n.classList.contains("user-profile")) return;

						emit(n);
					});
				}
			},
			parent,
			{ childList: true },
		);
	}

	userCard.value.length = 0;
	nextTick(() => {
		if (!el) return;
		userCard.value.push({ el, bind });
	});
}

let paused = false;
let pausedTimeout: ReturnType<typeof setTimeout> | null = null;

function onMessageRendered() {
	nextTick(() => {
		if (typeof pausedTimeout !== "number" && props.listElement.nextElementSibling) {
			pausedTimeout = setTimeout(() => {
				paused = true;
			}, 500);
		} else if (paused) {
			paused = false;
			if (pausedTimeout) clearTimeout(pausedTimeout);
		}
		if (paused) return;

		props.listElement.scrollTo({ top: props.listElement.scrollHeight });
	});
}

function patch(): void {
	const entries = props.listElement.querySelectorAll("[data-chat-entry]");
	for (const el of Array.from(entries)) {
		patchMessageElement(el as HTMLDivElement);
	}
}

watchEffect(patch);

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

<style scoped lang="scss">
.seventv-emote-menu-button {
	display: grid;
	align-items: center;
	border: none;
	background: transparent;
	cursor: pointer;
	transition: background 0.2s ease-in-out;
	height: 2.25rem;
	border-radius: 0.25rem;
	padding: 0 0.5rem;

	&:hover {
		background: rgba(255, 255, 255, 10%);
	}

	.icon {
		font-size: 1.25rem;
	}
}
</style>
