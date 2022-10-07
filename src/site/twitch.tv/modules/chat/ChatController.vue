<template>
	<Teleport v-if="extMounted && channel && channel.id" :to="containerEl">
		<div id="seventv-message-container" class="seventv-message-container">
			<div v-for="msg of chatStore.messages" :key="msg.id" :msg-id="msg.id">
				<template v-if="msg.seventv">
					<ChatMessage :msg="msg" @open-viewer-card="openViewerCard" />
				</template>
				<template v-else>
					<ChatMessageUnhandled :msg="msg" />
				</template>
			</div>
		</div>

		<!-- Data Logic -->
		<ChatData />

		<!-- Custom Scrollbar -->
		<div
			v-if="scroll.visible"
			class="seventv-scrollbar"
			:class="{ 'seventv-scrollbar--visible': scroll.visible }"
			:style="{ height: `${bounds.height}px` }"
		>
			<div
				class="seventv-scrollbar-thumb"
				:style="{
					top: `${containerEl.scrollHeight - containerEl.clientHeight}px`,
				}"
			/>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { getChatController, Selectors } from "@/site/twitch.tv";
import { ref, reactive, nextTick, onUnmounted, watch } from "vue";
import { useTwitchStore } from "@/site/twitch.tv/TwitchStore";
import { registerCardOpeners, sendDummyMessage } from "@/site/twitch.tv/modules/chat/ChatBackend";
import { log } from "@/common/Logger";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { getRandomInt } from "@/common/Rand";
import ChatMessage from "@/site/twitch.tv/modules/chat/components/ChatMessage.vue";
import ChatData from "./ChatData.vue";
import ChatMessageUnhandled from "./ChatMessageUnhandled.vue";
import { TransformWorkerMessageType } from "@/worker";

const store = useStore();
const chatStore = useTwitchStore();
const { channel } = storeToRefs(store);
const { messages } = storeToRefs(chatStore);

const extMounted = ref(false);
const controller = getChatController();
const controllerClass = controller?.constructor?.prototype;

const el = document.createElement("seventv-container");
el.id = "seventv-chat-controller";
const containerEl = ref<HTMLElement>(el);

const bounds = ref<DOMRect>(el.getBoundingClientRect());

log.debug("<ChatController>", "Hook started");

watch(channel, (channel) => {
	if (!channel) {
		return;
	}

	log.info("<ChatController>", `Joining #${channel.username}`);
});

const hooks = reactive({
	controllerMounted: (() => null) as Twitch.ChatControllerComponent["componentDidUpdate"],
	handleMessage: (() => null) as Twitch.ChatControllerComponent["props"]["messageHandlerAPI"]["handleMessage"],
	chatListEl: null as HTMLElement | null,
});

// Hook chat controller mount event
hooks.controllerMounted = controllerClass.componentDidUpdate;
{
	hooks.handleMessage = controller.props.messageHandlerAPI.handleMessage;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	controllerClass.componentDidUpdate = function (this: Twitch.ChatControllerComponent, args: any[]) {
		// Update current channel
		if (
			store.setChannel({
				id: this.props.channelID,
				username: this.props.channelLogin,
				display_name: this.props.channelDisplayName,
			})
		) {
			messages.value = [];
			scroll.paused = false;
			scroll.buffer.length = 0;
		}

		// Put placeholder to teleport our message list
		if (document.getElementById("seventv-chat-controller")) {
			return;
		}

		const t = Date.now();

		// Attach to chat
		const parentEl = document.querySelector(".chat-room__content");
		if (parentEl && !parentEl.contains(el)) {
			parentEl.insertBefore(el, parentEl.children[2]);

			// Hide the original chat list
			const chatList = (hooks.chatListEl = parentEl.querySelector(Selectors.ChatList));
			if (chatList) {
				chatList.classList.add("seventv-checked");
			}
		}

		// Send dummy message
		sendDummyMessage(this);

		const scrollContainer = document.querySelector<HTMLDivElement>(Selectors.ChatScrollableContainer);
		if (scrollContainer) {
			const observer = new MutationObserver((entries) => {
				for (let i = 0; i < entries.length; i++) {
					const rec = entries[i];

					rec.addedNodes.forEach((node) => {
						if (!(node instanceof HTMLElement) || !node.classList.contains("chat-line__message")) {
							return;
						}

						// Finalize all chat hooks
						if (!registerCardOpeners()) {
							return;
						}

						overwriteMessageContainer(this, scrollContainer);
						extMounted.value = true;

						// Bind twitch emotes
						if (this.props.emoteSetsData) {
							// We must wait for the data to be received
							const i = setInterval(() => {
								if (this.props.emoteSetsData?.loading) return;
								// Send the twitch emotes to the transform worker
								// These can later be fetched from IDB by components
								store.sendTransformRequest(TransformWorkerMessageType.TWITCH_EMOTES, {
									input: this.props.emoteSetsData?.emoteSets ?? [],
								});
								clearInterval(i);
							}, 200);
						}

						log.debug("<ChatController>", "Chat controller mounted", `(${Date.now() - t}ms)`);
						observer.disconnect(); // work is done, stop the mutation observer
					});
				}
			});

			// start looking for our system message
			// we need its component to be mounted to get the constructor to message-specific hooks
			observer.observe(scrollContainer, {
				childList: true,
			});

			log.debug("<ChatController>", "Spawning MutationObserver");
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return hooks.controllerMounted?.apply(this, [args] as any[any]);
	};
}

// Take over the chat's native message container
const handledMessageTypes = [0, 2];
const overwriteMessageContainer = (
	scopedController: Twitch.ChatControllerComponent,
	scrollContainer: HTMLDivElement,
) => {
	// Hook the handleMessage method
	// We will use our custom renderer for all supported types
	// if a message type is unsupported, we will instead render it as native
	// and then move it into our context.
	scopedController.props.messageHandlerAPI.handleMessage = function (
		this: Twitch.ChatControllerComponent["props"]["messageHandlerAPI"],
		msg: Twitch.ChatMessage,
	) {
		const t = Date.now() + getRandomInt(0, 1000);
		const msgData = Object.create({ seventv: true, t });
		for (const k of Object.keys(msg)) {
			msgData[k] = msg[k as keyof Twitch.ChatMessage];
		}

		const ok = onMessage(msgData);
		if (ok) return ""; // message was rendered by the extension

		// message type is not supported:
		// render is natively
		const o = new MutationObserver((x) => {
			for (let i = 0; i < x.length; i++) {
				const rec = x[i];

				rec.addedNodes.forEach((node) => {
					if (!(node instanceof HTMLElement)) return;

					const unhandledID = `seventv-unhandled-msg-ref-${msgData.t}`;
					msgData.seventv = false;
					msgData.id = unhandledID;
					chatStore.pushMessage(msgData);

					nextTick(() => {
						const wrapper = document.getElementById(unhandledID);
						if (wrapper) {
							wrapper.appendChild(node as Node);
						}

						scrollToLive();
					});

					o.disconnect();
					clearTimeout(timeout);
				});
			}
		});

		o.observe(scrollContainer, {
			childList: true,
		});
		const timeout = setTimeout(() => o.disconnect(), 1250);

		hooks.handleMessage.call(this, msg);
	};
};

// Handle scrolling
const scroll = reactive({
	init: false,
	sys: true,
	visible: true,
	paused: false, // whether or not scrolling is paused
	buffer: [] as Twitch.ChatMessage[], // twitch chat message buffe when scrolling is paused
});

const onMessage = (msg: Twitch.ChatMessage): boolean => {
	if (msg.id === "seventv-hook-message" || !handledMessageTypes.includes(msg.type)) {
		return false;
	}

	if (scroll.paused) {
		// if scrolling is paused, buffer the message
		scroll.buffer.push(msg);
		if (scroll.buffer.length > chatStore.lineLimit) scroll.buffer.shift();

		return true;
	}

	// Add message to store
	// it will be rendered on the next tick
	chatStore.pushMessage(msg);

	nextTick(() => {
		// autoscroll on new message
		scrollToLive();
	});

	return true;
};

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
	scroll.paused = true;
	if (live) {
		scroll.paused = false;
		scroll.init = true;

		chatStore.messages.push(...scroll.buffer);
		scroll.buffer.length = 0;

		nextTick(() => {
			scroll.init = false;
			scrollToLive();
		});
	}
});

// Apply new boundaries when the window is resized
const resizeObserver = new ResizeObserver(() => {
	bounds.value = containerEl.value.getBoundingClientRect();
});
resizeObserver.observe(containerEl.value);

const openViewerCard = (ev: MouseEvent, viewer: Twitch.ChatUser) => {
	controller.sendMessage(`/user ${viewer.userLogin}`);

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

onUnmounted(() => {
	resizeObserver.disconnect();

	controllerClass.componentDidUpdate = hooks.controllerMounted;
	controller.props.messageHandlerAPI.handleMessage = hooks.handleMessage;

	el.remove();
	hooks.chatListEl?.classList.remove("seventv-checked");

	log.debug("<ChatController> Unmounted");
});
</script>

<style lang="scss">
#seventv-chat-controller {
	display: flex;
	flex-direction: column !important;
	-webkit-box-flex: 1 !important;
	flex-grow: 1 !important;
	overflow: auto !important;
	overflow-x: hidden !important;

	.seventv-message-container {
		padding-bottom: 1em;
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
}

.community-highlight {
	opacity: 0.75;
	backdrop-filter: blur(1em);
}

.chat-list--default.seventv-checked {
	display: none !important;
}
</style>
