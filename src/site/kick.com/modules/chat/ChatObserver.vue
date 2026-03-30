<template>
	<!-- Patch messages -->
	<template v-for="bind of messages" :key="bind.id">
		<ChatMessageVue :bind="bind" @open-card="onOpenUserCard" />
	</template>

	<!-- Modify user card -->
	<template v-for="x of userCard" :key="x.el">
		<ChatUserCard :el="x.el" :bind="x.bind" />
	</template>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from "vue";
import { useMutationObserver } from "@vueuse/core";
import { ObserverPromise } from "@/common/Async";
import { Logger } from "@/common/Logger";
import { getReactProps } from "@/common/ReactHooks";
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
const userCard = ref<ActiveUserCard[]>([]);
const bounds = ref(new DOMRect());

let messageMap = new WeakMap<HTMLDivElement, ChatMessageBinding>();
let warnedMarkupMismatch = false;
let unpauseListenerAttached = false;
let unpauseListenerTarget: HTMLDivElement | null = null;

interface ResolvedMessageHosts {
	userCardTriggerEl: HTMLElement;
	badgeAnchorEl: HTMLElement;
	originalContentEls: HTMLElement[];
	messageContent: string;
}

function isDefaultReactMessageProps(props: unknown): props is Kick.Message.DefaultProps {
	return (
		props != null &&
		typeof props === "object" &&
		"sender" in props &&
		typeof props.sender === "object" &&
		"message" in props &&
		typeof props.message === "object"
	);
}

function getMessageReactProps(el: HTMLDivElement): Kick.Message.DefaultProps | undefined {
	const messageElements = el.querySelector("div > div[style*='chatroom-font-size']");
	if (!messageElements) return;
	const props = getReactProps<Kick.Message.MessageListProps>(messageElements);
	if (!props || !Array.isArray(props.children)) return;

	const child = props.children.find((child) => child?.props?.sender);
	return child?.props;
}

function warnMarkupMismatch(reason: string): void {
	if (warnedMarkupMismatch) return;

	warnedMarkupMismatch = true;
	Logger.Get().warn("kick chat message structure changed, skipping malformed message", `reason=${reason}`);
}

function normalizeText(value: string | null | undefined): string {
	return (value ?? "").replace(/\s+/g, " ").trim();
}

function matchesUsername(el: HTMLElement, username: string): boolean {
	const normalizedUsername = normalizeText(username);
	if (!normalizedUsername) return false;

	return [el.getAttribute("title"), el.getAttribute("aria-label"), el.textContent].some(
		(value) => normalizeText(value) === normalizedUsername,
	);
}

function resolveUsernameTriggerEl(el: HTMLDivElement, username: string): HTMLElement | null {
	const directButton = el.querySelector<HTMLElement>("div.inline-flex > button[title]");
	if (directButton) return directButton;

	const legacyUsername = el.querySelector<HTMLElement>(".chat-entry-username");
	if (legacyUsername) return legacyUsername;

	for (const button of Array.from(el.querySelectorAll<HTMLElement>("button"))) {
		if (matchesUsername(button, username)) return button;
	}

	return null;
}

function isLeafLikeTextNode(el: HTMLElement): boolean {
	return !el.querySelector("span, p, div");
}

function isExcludedContentNode(el: HTMLElement): boolean {
	if (el.closest("button, a, [role='button'], img, svg, video, picture, figure")) return true;
	if (el.closest(".seventv-badge-list, .seventv-container")) return true;

	const className = typeof el.className === "string" ? el.className : "";
	return /avatar|badge|icon|emote|profile/i.test(className);
}

function dedupeElements<T extends HTMLElement>(elements: T[]): T[] {
	return Array.from(new Set(elements));
}

function resolveContentEls(el: HTMLDivElement, messageContent: string): HTMLElement[] {
	const directTextEls = Array.from(el.querySelectorAll<HTMLElement>("span.font-normal"));
	if (directTextEls.length > 0) return dedupeElements(directTextEls);

	const legacyTextEls = Array.from(el.querySelectorAll<HTMLElement>(".chat-entry-content"));
	if (legacyTextEls.length > 0) return dedupeElements(legacyTextEls);

	const normalizedMessage = normalizeText(messageContent);
	if (!normalizedMessage) return [];

	const contentEls = Array.from(el.querySelectorAll<HTMLElement>("span, p, div")).filter((candidate) => {
		if (isExcludedContentNode(candidate)) return false;
		if (!isLeafLikeTextNode(candidate)) return false;

		const text = normalizeText(candidate.textContent);
		if (!text) return false;

		return normalizedMessage.includes(text);
	});

	return dedupeElements(contentEls);
}

function resolveMessageHosts(el: HTMLDivElement, props: Kick.Message.DefaultProps): ResolvedMessageHosts | null {
	const messageContent = props.message.content ?? "";
	const originalContentEls = resolveContentEls(el, messageContent);
	let userCardTriggerEl = resolveUsernameTriggerEl(el, props.sender.username);
	let missingHosts: string[] = [];

	if (originalContentEls.length === 0) {
		missingHosts.push("content hosts");
	}

	if (!userCardTriggerEl) {
		missingHosts.push("username trigger");
		userCardTriggerEl = originalContentEls[0] ?? null;
	}

	if (!userCardTriggerEl || originalContentEls.length === 0) {
		if (missingHosts.length > 0) warnMarkupMismatch(`missing ${missingHosts.join(" and ")}`);
		return null;
	}

	return {
		userCardTriggerEl,
		badgeAnchorEl: userCardTriggerEl,
		originalContentEls,
		messageContent,
	};
}

function patchMessageElement(el: HTMLDivElement & { __seventv?: boolean }, noBuffer?: boolean): void {
	if (el.__seventv) return; // already patched
	if (!el.hasAttribute("data-index")) return; // not a message
	const props = getMessageReactProps(el);
	if (!props) return;
	const hosts = resolveMessageHosts(el, props);
	if (!hosts) return;

	el.__seventv = true;

	const entryID = isDefaultReactMessageProps(props) ? props.messageId : props;
	const userID = props.sender.id.toString();
	const username = props.sender.username;

	const bind: ChatMessageBinding = {
		id: entryID,
		authorID: userID,
		authorName: username,
		messageContent: hosts.messageContent,
		originalContentEls: hosts.originalContentEls,
		userCardTriggerEl: hosts.userCardTriggerEl,
		badgeAnchorEl: hosts.badgeAnchorEl,
		el,
	};

	if (!noBuffer) el.classList.add("seventv-chat-message-buffered");

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

function patch(listElement: HTMLDivElement): void {
	const entries = listElement.querySelectorAll("[data-index]");
	for (const el of Array.from(entries)) {
		patchMessageElement(el as HTMLDivElement, true);
	}
}

const expectPause = ref(false);

function detachUnpauseListener(): void {
	if (unpauseListenerTarget) {
		unpauseListenerTarget.removeEventListener("click", onUnpauseClick);
	}

	unpauseListenerTarget = null;
	unpauseListenerAttached = false;
}

function onMessageRendered(listElement: HTMLDivElement) {
	if (!listElement.isConnected) {
		detachUnpauseListener();
		return;
	}

	if (listElement.nextElementSibling && !unpauseListenerAttached) {
		detachUnpauseListener();
		unpauseListenerAttached = true;
		unpauseListenerTarget = listElement;
		listElement.addEventListener("click", onUnpauseClick);
	}
	if (expectPause.value) return;

	nextTick(() => {
		if (!listElement.isConnected) return;
		listElement.scrollTo({ top: listElement.scrollHeight });
	});
}

function onUnpauseClick(): void {
	detachUnpauseListener();
	expectPause.value = false;
}

onUnmounted(() => {
	detachUnpauseListener();
});

watch(
	() => props.listElement,
	(listElement, _, onCleanup) => {
		messages.value.length = 0;
		messageBuffer.value.length = 0;
		messageDeleteBuffer.value.length = 0;
		messageMap = new WeakMap();
		userCard.value.length = 0;
		expectPause.value = false;
		detachUnpauseListener();

		if (!listElement?.isConnected) return;

		patch(listElement);
		bounds.value = listElement.getBoundingClientRect();
		listElement.classList.toggle("seventv-chat-observer", true);

		const onWheel = () => {
			if (!listElement.isConnected) return;

			const top = Math.floor(listElement.scrollTop);
			const h = Math.floor(listElement.scrollHeight - bounds.value.height);

			if (top >= h - 1) {
				expectPause.value = false;
				return;
			}

			expectPause.value = true;
		};
		listElement.addEventListener("wheel", onWheel);

		const stopListObserver = useMutationObserver(
			listElement,
			(records) => {
				if (!listElement.isConnected) return;

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

					flush(listElement);
				}
			},
			{ childList: true },
		).stop;

		const stopParentObserver = listElement.parentElement
			? useMutationObserver(
					listElement.parentElement,
					() => {
						if (!listElement.isConnected) {
							expectPause.value = false;
							detachUnpauseListener();
							return;
						}
						if (listElement.nextElementSibling) return;

						expectPause.value = false;
						detachUnpauseListener();
					},
					{ childList: true },
			  ).stop
			: () => {
					void 0;
			  };

		flush(listElement);

		onCleanup(() => {
			stopListObserver();
			stopParentObserver();
			detachUnpauseListener();
			listElement.removeEventListener("wheel", onWheel);
			listElement.classList.toggle("seventv-chat-observer", false);
		});
	},
	{ immediate: true },
);

function flush(listElement: HTMLDivElement): void {
	if (!listElement.isConnected) return;

	if (messageBuffer.value.length) {
		const unbuf = messageBuffer.value.splice(0, messageBuffer.value.length);

		for (const bind of unbuf) {
			bind.el.classList.remove("seventv-chat-message-buffered");
		}
		messages.value.push(...unbuf);
	}

	if (messageDeleteBuffer.value.length >= 25) {
		for (const bind of messageDeleteBuffer.value) {
			messages.value.splice(messages.value.indexOf(bind), 1);
		}

		messageDeleteBuffer.value.length = 0;
	}
	onMessageRendered(listElement);
}
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
.seventv-chat-message-buffered {
	display: none !important;
}
</style>
