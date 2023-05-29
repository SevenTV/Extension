<template>
	<template v-if="shallowList">
		<ChatObserver :list-element="shallowList" />
		<ChatAutocomplete />
	</template>
	<ChatData />

	<Teleport :to="emoteMenuButtonContainer">
		<button ref="emoteMenuButton" class="seventv-emote-menu-button" @click="emoteMenu.open = !emoteMenu.open">
			<Logo7TV provider="7TV" class="icon" />
		</button>
	</Teleport>

	<template v-if="emoteMenu.open && emoteMenuAnchor">
		<EmoteMenu :anchor-el="emoteMenuAnchor" />
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, ref, toRaw, watchEffect } from "vue";
import { ObserverPromise } from "@/common/Async";
import { log } from "@/common/Logger";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useWorker } from "@/composable/useWorker";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import ChatAutocomplete from "./ChatAutocomplete.vue";
import ChatObserver from "./ChatObserver.vue";
import ChatData from "@/app/chat/ChatData.vue";
import EmoteMenu from "@/app/emote-menu/EmoteMenu.vue";
import { useEmoteMenuContext } from "@/app/emote-menu/EmoteMenuContext";

const props = defineProps<{
	slug: string;
}>();

defineExpose({
	onMessageSend,
});

function onMessageSend() {
	sendWorkerMessage("CHANNEL_ACTIVE_CHATTER", {
		channel: toRaw(ctx),
	});
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

const emoteMenu = useEmoteMenuContext();
const emoteMenuAnchor = document.getElementById("chatroom-footer");

const emoteMenuButtonContainer = document.createElement("seventv-container");

let observer: ObserverPromise<HTMLDivElement> | null = null;

watchEffect(async () => {
	const parent = document.getElementById("chatroom");
	if (!parent) return;

	const inputRow = parent.querySelector(".chat-message-row");
	if (!inputRow) return;

	inputRow.lastElementChild?.insertAdjacentElement("beforebegin", emoteMenuButtonContainer);

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

onUnmounted(() => {
	emoteMenuButtonContainer.remove();
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
