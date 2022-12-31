import { nextTick, reactive, ref, Ref, toRefs, watchEffect } from "vue";
import UiScrollableVue from "@/ui/UiScrollable.vue";

const data = reactive({
	// Message Data
	messages: [] as Twitch.ChatMessage[],
	messageBuffer: [] as Twitch.ChatMessage[],
	emoteMap: {} as Record<string, SevenTV.ActiveEmote>,
	emoteProviders: {} as Record<SevenTV.Provider, Record<string, SevenTV.EmoteSet>>,
	twitchBadgeSets: {} as Twitch.BadgeSets | null,

	// User State Data
	isModerator: false,
	isVIP: false,
	currentChannel: {} as CurrentChannel,

	// Scroll Data
	userInput: 0,
	lineLimit: 150,
	init: false,
	sys: true,
	visible: true,
	paused: false, // whether or not scrolling is paused
	scrollBuffer: [] as Twitch.ChatMessage[], // twitch chat message buffe when scrolling is paused

	// Functions
	sendMessage: (() => {
		return;
	}) as (msg: string) => void,
});

let flushTimeout: number | undefined;

export function useChatAPI(scroller?: Ref<InstanceType<typeof UiScrollableVue> | undefined>, bounds?: Ref<DOMRect>) {
	const container = ref<HTMLElement | null>(null);

	watchEffect(() => {
		if (scroller?.value?.container) {
			container.value = scroller.value.container;
		}

		if (scroller?.value?.isActive) {
			data.userInput++;
		}
	});

	function addMessage(message: Twitch.ChatMessage): void {
		if (data.paused) {
			// if scrolling is paused, buffer the message
			data.scrollBuffer.push(message as Twitch.ChatMessage);
			if (data.scrollBuffer.length > data.lineLimit) data.scrollBuffer.shift();

			return;
		}

		data.messageBuffer.push(message);

		flush();
	}

	function clear() {
		data.messages = [];
		data.messageBuffer = [];
		data.emoteProviders = {} as typeof data.emoteProviders;
	}

	function flush(): void {
		if (flushTimeout) return;

		flushTimeout = window.setTimeout(() => {
			if (data.paused) {
				flushTimeout = undefined;
				return;
			}

			data.init = false;

			const overflowLimit = data.lineLimit * 1.25;
			if (data.messages.length > overflowLimit) {
				data.messages.splice(0, data.messages.length - data.lineLimit);
			}

			flushTimeout = window.setTimeout(() => {
				if (data.messageBuffer.length > 0) {
					const unbuf = data.messageBuffer.splice(0, data.messageBuffer.length);

					for (const msg of unbuf) {
						data.messages.push(msg);
					}
				}

				nextTick(() => scrollToLive());

				flushTimeout = undefined;
			}, 25);
		}, 25);
	}

	/**
	 * Scrolls the chat to the bottom
	 */
	function scrollToLive(): void {
		if (!container.value || !bounds?.value || data.paused) return;

		data.sys = true;

		container.value.scrollTo({ top: container.value.scrollHeight });

		bounds.value = container.value.getBoundingClientRect();
	}

	/**
	 * Pauses the scrolling of the chat
	 */
	function pauseScrolling(): void {
		data.paused = true;
	}

	/**
	 * Unpauses the scrolling of the chat
	 */
	function unpauseScrolling(): void {
		data.paused = false;
		data.init = true;

		data.messages.push(...data.scrollBuffer);
		data.scrollBuffer.length = 0;

		nextTick(() => {
			data.init = false;
			scrollToLive();
		});
	}

	function onScroll() {
		if (!container.value || !bounds?.value) return;

		const top = Math.floor(container.value.scrollTop);
		const h = Math.floor(container.value.scrollHeight - bounds.value.height);

		// Whether or not the scrollbar is at the bottom
		const live = top >= h - 1;

		if (data.init) {
			return;
		}
		if (data.sys) {
			data.sys = false;
			return;
		}

		if (data.userInput > 0) {
			data.userInput = 0;
			pauseScrolling();
		}

		// Check if the user has scrolled back down to live mode
		if (live) {
			unpauseScrolling();
		}
	}

	function onWheel() {
		data.userInput++;
	}

	const {
		messages,
		lineLimit,
		emoteMap,
		emoteProviders,
		twitchBadgeSets,
		sys,
		init,
		scrollBuffer,
		paused,
		isModerator,
		isVIP,
		sendMessage,
		currentChannel,
	} = toRefs(data);

	return {
		messages: messages,
		lineLimit: lineLimit,
		emoteMap: emoteMap,
		emoteProviders: emoteProviders,
		twitchBadgeSets: twitchBadgeSets,

		isModerator: isModerator,
		isVIP: isVIP,
		currentChannel: currentChannel,

		scrollSys: sys,
		scrollInit: init,
		scrollBuffer: scrollBuffer,
		scrollPaused: paused,

		sendMessage,
		clear,
		scrollToLive,
		onScroll,
		onWheel,
		addMessage,
		pauseScrolling,
		unpauseScrolling,
	};
}
