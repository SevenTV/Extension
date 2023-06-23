<template>
	<!-- Patch messages -->
	<template v-for="(bind, i) of messages" :key="bind.id">
		<ChatMessageVue :parity="i % 2 === 0 ? 'even' : 'odd'" :bind="bind" @open-card="onOpenUserCard" />
	</template>

	<!-- Modify user card -->
	<template v-for="x of userCard" :key="x.el">
		<ChatUserCard :el="x.el" :bind="x.bind" />
	</template>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref, watchEffect } from "vue";
import { useMutationObserver } from "@vueuse/core";
import { ObserverPromise } from "@/common/Async";
import { useConfig } from "@/composable/useSettings";
import ChatMessageVue, { ChatMessageBinding } from "./ChatMessage.vue";
import ChatUserCard from "./ChatUserCard.vue";

interface ActiveUserCard {
	bind: ChatMessageBinding;
	el: HTMLDivElement;
}

const props = defineProps<{
	listElement: HTMLDivElement;
}>();

const messages = ref<ChatMessageBinding[]>([]);
const messageBuffer = ref<ChatMessageBinding[]>([]);
const messageDeleteBuffer = ref<ChatMessageBinding[]>([]);
const messageMap = reactive<WeakMap<HTMLDivElement, ChatMessageBinding>>(new WeakMap());
const userCard = ref<ActiveUserCard[]>([]);

const refreshRate = useConfig<number>("chat.message_batch_duration", 100);

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

	el.classList.add("seventv-chat-message-buffered");

	messageBuffer.value.push(bind);
	messageMap.set(el, bind);
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

function patch(): void {
	const entries = props.listElement.querySelectorAll("[data-chat-entry]");
	for (const el of Array.from(entries)) {
		patchMessageElement(el as HTMLDivElement);
	}
}

const expectPause = ref(false);
const bounds = ref(props.listElement.getBoundingClientRect());
let unpauseListenerAttached = false;

function onMessageRendered() {
	if (props.listElement.nextElementSibling && !unpauseListenerAttached) {
		unpauseListenerAttached = true;
		props.listElement.addEventListener("click", onUnpauseClick);
	}
	if (expectPause.value) return;

	nextTick(() => {
		props.listElement.scrollTo({ top: props.listElement.scrollHeight });
	});
}

function onUnpauseClick(): void {
	props.listElement.removeEventListener("click", onUnpauseClick);
	expectPause.value = false;
	unpauseListenerAttached = false;
}

onMounted(() => {
	const el = props.listElement;
	if (!el) return;

	el.addEventListener("wheel", () => {
		const top = Math.floor(el.scrollTop);
		const h = Math.floor(el.scrollHeight - bounds.value.height);

		if (top >= h - 1) {
			expectPause.value = false;
			return;
		}

		expectPause.value = true;
	});
});

onUnmounted(() => {
	props.listElement.removeEventListener("click", onUnpauseClick);
});

watchEffect(() => {
	patch();

	bounds.value = props.listElement.getBoundingClientRect();

	props.listElement.classList.toggle("seventv-chat-observer", true);
});

useMutationObserver(
	props.listElement,
	(records) => {
		for (const rec of records) {
			rec.addedNodes.forEach((n) => {
				if (!(n instanceof HTMLDivElement)) return;

				patchMessageElement(n);
			});

			rec.removedNodes.forEach((n) => {
				if (!(n instanceof HTMLDivElement)) return;

				const b = messageMap.get(n);
				if (!b) return;

				messageDeleteBuffer.value.push(b);
				messageMap.delete(n);
			});

			flush();
		}
	},
	{ childList: true },
);

let flushTimeout: number | null = null;
function flush(): void {
	if (flushTimeout) return;

	flushTimeout = window.setTimeout(() => {
		if (messageBuffer.value.length) {
			const unbuf = messageBuffer.value.splice(0, messageBuffer.value.length);

			for (const bind of unbuf) {
				bind.el.classList.remove("seventv-chat-message-buffered");
			}
			messages.value.push(...unbuf);
		}

		if (messageDeleteBuffer.value.length >= 25) {
			flushTimeout = window.setTimeout(() => {
				for (const bind of messageDeleteBuffer.value) {
					messages.value.splice(messages.value.indexOf(bind), 1);
				}

				messageDeleteBuffer.value.length = 0;

				flushTimeout = null;
			}, refreshRate.value / 1.5);
		} else {
			flushTimeout = null;
		}

		onMessageRendered();
	}, refreshRate.value);
}

useMutationObserver(
	props.listElement.parentElement!,
	() => {
		if (props.listElement.nextElementSibling) return;

		expectPause.value = false;
	},
	{ childList: true },
);

onUnmounted(() => {
	props.listElement.classList.toggle("seventv-chat-observer", false);
});
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

<style lang="scss">
:root.seventv-alternating-chat-lines {
	.seventv-chat-observer {
		> div[parity="even"] {
			background-color: hsla(0deg, 0%, 50%, 6%);
		}
	}
}

.seventv-chat-message-buffered {
	display: none !important;
}
</style>
