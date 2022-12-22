<template>
	<Teleport v-if="extMounted && channel && channel.id" :to="containerEl">
		<div id="seventv-message-container" class="seventv-message-container">
			<ChatList :controller="controller" :messages="chatStore.messages" />
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
import { getChatController, getChatLines, Selectors } from "@/site/twitch.tv";
import { ref, reactive, nextTick, onUnmounted, watch } from "vue";
import { useTwitchStore } from "@/site/twitch.tv/TwitchStore";
import { registerCardOpeners, sendDummyMessage } from "@/site/twitch.tv/modules/chat/ChatBackend";
import { log } from "@/common/Logger";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { getRandomInt } from "@/common/Rand";
import ChatData from "./ChatData.vue";
import ChatList from "./ChatList.vue";
import { defineFunctionHook, definePropertyHook, unsetPropertyHook } from "@/common/Reflection";

const emit = defineEmits<{
	(e: "hooked"): void;
}>();

const store = useStore();
const chatStore = useTwitchStore();
const { channel } = storeToRefs(store);
const { messages, lineLimit } = storeToRefs(chatStore);

const extMounted = ref(false);
const controller = ref<Twitch.ChatControllerComponent | undefined>();

const el = document.createElement("seventv-container");
el.id = "seventv-chat-controller";
const containerEl = ref<HTMLElement>(el);
const replacedEl = ref<Element | null>(null);

const bounds = ref<DOMRect>(el.getBoundingClientRect());

log.debug("<ChatController>", "Hook started");

watch(channel, (channel) => {
	if (!channel) {
		return;
	}

	log.info("<ChatController>", `Joining #${channel.username}`);
});

// TODO: replace this with a temporary mutation observer
const ctrl = getChatController();
if (ctrl) setController(ctrl);

// Hook chat controller events
function setController(ctrl: Twitch.ChatControllerComponent) {
	unhookController();

	controller.value = ctrl;

	const cls = ctrl.constructor.prototype;
	defineFunctionHook(
		cls,
		"componentDidUpdate",
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function (this: Twitch.ChatControllerComponent, old, ...args: any[]) {
			// Update refrence to current controller if its not us
			if (controller.value != this) controller.value = this;

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
				const replace = parentEl.querySelector(Selectors.ChatList);
				if (replace) {
					parentEl.insertBefore(el, replace);

					replacedEl.value = replace;

					// Hide the original chat list
					replace.classList.add("seventv-checked");
				}
			}

			const scrollContainer = document.querySelector<HTMLDivElement>(Selectors.ChatScrollableContainer);

			// Send dummy message
			sendDummyMessage(this);

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

							// Hook chat line
							const line = getChatLines(scrollContainer, ["seventv-hook-message"])[0];
							if (line && line.component) {
								const component = line.component;
								definePropertyHook(component, "props", {
									value: (v: typeof component["props"]) => {
										// store twitch badge sets
										definePropertyHook(v, "badgeSets", {
											value: (v: typeof component["props"]["badgeSets"]) => {
												if (v.count === 0) return;

												chatStore.twitchBadgeSets = v;

												unsetPropertyHook(component, "props");
												unsetPropertyHook(component.props, "badgeSets");
											},
										});
									},
								});
							}

							overwriteMessageContainer(this, scrollContainer);
							emit("hooked");
							extMounted.value = true;

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

			return old?.apply(this, args);
		},
	);
}

function unhookController() {
	if (controller.value) {
		const ctrl = controller.value;
		unsetPropertyHook(ctrl, "props");
		unsetPropertyHook(ctrl.constructor.prototype, "componentDidUpdate");

		if (ctrl.props) {
			unsetPropertyHook(ctrl.props, "emoteSetsData");

			if (ctrl.props.messageHandlerAPI) {
				unsetPropertyHook(ctrl.props.messageHandlerAPI, "handleMessage");
			}
		}
	}
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
	defineFunctionHook(
		scopedController.props.messageHandlerAPI,
		"handleMessage",
		function (old, msg: Twitch.ChatMessage) {
			const t = Date.now() + getRandomInt(0, 1000);
			const msgData = Object.create({ seventv: true, t });
			for (const k of Object.keys(msg)) {
				msgData[k] = msg[k as keyof Twitch.ChatMessage];
			}

			const ok = onMessage(msgData);
			if (ok) return ""; // message was rendered by the extension

			if (!old) return; // we cant continue since there is no native renderer to call.

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

			old.call(this, msg);
		},
	);
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
		if (scroll.buffer.length > lineLimit.value) scroll.buffer.shift();

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

	unhookController();

	el.remove();
	if (replacedEl.value) replacedEl.value.classList.remove("seventv-checked");

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
