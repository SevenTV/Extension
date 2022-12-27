<template>
	<Teleport v-if="channel && channel.id" :to="containerEl">
		<div id="seventv-message-container" class="seventv-message-container">
			<ChatList :messages="chatStore.messages" :controller="controller.component" />
		</div>

		<!-- Data Logic -->
		<ChatData />

		<!-- New Messages during Scrolling Pause -->
		<div
			v-if="scroll.paused && scroll.buffer.length > 0"
			class="seventv-message-buffer-notice"
			@click="unpauseScrolling"
		>
			<span>{{ scroll.buffer.length }}{{ scroll.buffer.length >= lineLimit ? "+" : "" }} new messages</span>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { MessageType, ModerationType } from "@/site/twitch.tv";
import { ref, reactive, nextTick, onUnmounted, watch, watchEffect, toRefs } from "vue";
import { useChatStore } from "@/site/twitch.tv/TwitchStore";
import { log } from "@/common/Logger";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { getRandomInt } from "@/common/Rand";
import { defineFunctionHook, definePropertyHook } from "@/common/Reflection";
import { HookedInstance } from "@/common/ReactHooks";
import ChatData from "./ChatData.vue";
import ChatList from "./ChatList.vue";

const props = defineProps<{
	list: HookedInstance<Twitch.ChatListComponent>;
	controller: HookedInstance<Twitch.ChatControllerComponent>;
}>();

const store = useStore();
const chatStore = useChatStore();
const { channel } = storeToRefs(store);
const { lineLimit } = storeToRefs(chatStore);

const { list, controller } = toRefs(props);

const el = document.createElement("seventv-container");
el.id = "seventv-chat-controller";

const containerEl = ref<HTMLElement>(el);
const replacedEl = ref<Element | null>(null);

const bounds = ref<DOMRect>(el.getBoundingClientRect());

watch(channel, (channel) => {
	if (!channel) {
		return;
	}

	log.info("<ChatController>", `Joining #${channel.username}`);
});

// Handle scrolling
const scroll = reactive({
	init: false,
	sys: true,
	visible: true,
	paused: false, // whether or not scrolling is paused
	buffer: [] as Twitch.ChatMessage[], // twitch chat message buffe when scrolling is paused
});

const dataSets = reactive({
	badges: false,
});

const currentChannel = ref<CurrentChannel | null>(null);

watchEffect(() => {
	if (!list.value.domNodes) return;

	const rootNode = list.value.domNodes.root;
	if (!rootNode) return;

	rootNode.classList.add("seventv-chat-list");

	containerEl.value = rootNode as HTMLElement;

	if (!list.value.component?.props?.messageHandlerAPI) return;

	defineFunctionHook(
		list.value.component.props.messageHandlerAPI,
		"handleMessage",
		function (old, msg: Twitch.Message) {
			const t = Date.now() + getRandomInt(0, 1000);
			const msgData = Object.create({ seventv: true, t });
			for (const k of Object.keys(msg)) {
				msgData[k] = msg[k as keyof Twitch.Message];
			}

			const ok = onMessage(msgData);
			if (ok) return ""; // message was rendered by the extension

			return old?.call(this, msg);
		},
	);

	// Keep track of props
	definePropertyHook(list.value.component, "props", {
		value(v: typeof list.value.component.props) {
			if (!dataSets.badges) {
				// Find message to grab some data
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const msgItem = (v.children[0] as any | undefined)?.props as Twitch.ChatLineComponent["props"];
				if (!msgItem?.badgeSets?.count) return;

				chatStore.twitchBadgeSets = msgItem.badgeSets;

				dataSets.badges = true;
			}
		},
	});

	definePropertyHook(controller.value.component, "props", {
		value(v: typeof controller.value.component.props) {
			currentChannel.value = {
				id: v.channelID,
				username: v.channelLogin,
				display_name: v.channelDisplayName,
			};
		},
	});
});

watchEffect(() => {
	if (currentChannel.value) {
		store.setChannel(currentChannel.value);
	}
});

const nodeMap = new Map<string, Element>();

watch(list.value.domNodes, (nodes) => {
	const missingIds = new Set<string>(nodeMap.keys());

	for (const [nodeId, node] of Object.entries(nodes)) {
		if (nodeId === "root") continue;
		missingIds.delete(nodeId);

		if (nodeMap.has(nodeId)) continue;

		chatStore.pushMessage({
			id: nodeId + "-unhandled",
			element: node,
		} as Twitch.ChatMessage);

		nodeMap.set(nodeId, node);
	}

	for (const nodeId of missingIds) {
		nodeMap.delete(nodeId);
	}
});

// Take over the chat's native message container
const onMessage = (msg: Twitch.Message): boolean => {
	if (msg.id === "seventv-hook-message") {
		return false;
	}
	switch (msg.type) {
		case MessageType.MESSAGE:
			onChatMessage(msg as Twitch.ChatMessage);
			break;
		case MessageType.MODERATION:
			onModerationMessage(msg as Twitch.ModerationMessage);
			break;
		default:
			return false;
	}
	return true;
};

function onChatMessage(msg: Twitch.ChatMessage) {
	if (scroll.paused) {
		// if scrolling is paused, buffer the message
		scroll.buffer.push(msg as Twitch.ChatMessage);
		if (scroll.buffer.length > lineLimit.value) scroll.buffer.shift();
		return true;
	}
	// Add message to store
	// it will be rendered on the next tick
	chatStore.pushMessage(msg as Twitch.ChatMessage);
	nextTick(() => {
		// autoscroll on new message
		scrollToLive();
	});
}

function onModerationMessage(msg: Twitch.ModerationMessage) {
	if (msg.moderationType == ModerationType.DELETE) {
		const found = chatStore.messages.find((m) => m.id == msg.targetMessageID);
		if (found) found.deleted = true;
	} else {
		chatStore.messages.forEach((m) => {
			if (!m.seventv || m.user.userLogin != msg.userLogin) return;
			m.banned = true;
		});
	}
}

const scrollToLive = () => {
	if (!containerEl.value || scroll.paused) {
		return;
	}

	scroll.sys = true;

	containerEl.value.scrollTo({
		top: containerEl.value?.scrollHeight,
	});
	bounds.value = containerEl.value.getBoundingClientRect();
};

function unpauseScrolling(): void {
	scroll.paused = false;
	scroll.init = true;

	chatStore.messages.push(...scroll.buffer);
	scroll.buffer.length = 0;

	nextTick(() => {
		scroll.init = false;
		scrollToLive();
	});
}

function pauseScrolling(): void {
	scroll.paused = true;
}

// Listen for scroll events
containerEl.value.addEventListener("scroll", () => {
	const top = Math.floor(containerEl.value.scrollTop);
	const h = Math.floor(containerEl.value.scrollHeight - bounds.value.height);

	// Whether or not the scrollbar is at the bottom
	const live = top >= h - 3;

	if (scroll.init) {
		return;
	}
	if (scroll.sys) {
		scroll.sys = false;
		return;
	}

	// Check if the user has scrolled back down to live mode
	pauseScrolling();
	if (live) {
		unpauseScrolling();
	}
});

// Apply new boundaries when the window is resized
const resizeObserver = new ResizeObserver(() => {
	bounds.value = containerEl.value.getBoundingClientRect();
});
resizeObserver.observe(containerEl.value);

onUnmounted(() => {
	resizeObserver.disconnect();

	el.remove();
	if (replacedEl.value) replacedEl.value.classList.remove("seventv-checked");

	log.debug("<ChatController> Unmounted");
});
</script>

<style lang="scss">
seventv-container.seventv-chat-list {
	display: flex;
	flex-direction: column !important;
	-webkit-box-flex: 1 !important;
	flex-grow: 1 !important;
	overflow: auto !important;
	overflow-x: hidden !important;

	> seventv-container {
		display: none;
	}

	.seventv-message-container {
		padding: 1em 0;
		line-height: 1.5em;
	}

	// Chat padding
	&.custom-scrollbar {
		scrollbar-width: none;

		&::-webkit-scrollbar {
			width: 0;
			height: 0;
		}

		.seventv-scrollbar {
			$width: 1em;

			position: absolute;
			right: 0;
			width: $width;
			overflow: hidden;
			border-radius: 0.33em;
			background-color: black;

			> .seventv-scrollbar-thumb {
				position: absolute;
				width: 100%;

				background-color: rgb(77, 77, 77);
			}
		}
	}

	.seventv-message-buffer-notice {
		cursor: pointer;
		position: absolute;
		bottom: 8em;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5em;
		border-radius: 0.33em;
		color: #fff;
		background-color: rgba(0, 0, 0, 0.5%);
		backdrop-filter: blur(0.05em);
	}
}

.community-highlight {
	opacity: 0.75;
	backdrop-filter: blur(1em);
}

.chat-list--default.seventv-checked {
	display: none !important;
}
</style>
