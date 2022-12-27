import { nextTick, reactive, Ref } from "vue";
import { useEventListener } from "@vueuse/core";
import { useChatStore } from "@/site/twitch.tv/ChatStore";

const data = reactive({
	userInput: 0,
	init: false,
	sys: true,
	visible: true,
	paused: false, // whether or not scrolling is paused
	buffer: [] as Twitch.ChatMessage[], // twitch chat message buffe when scrolling is paused
});

export function useChatScroll(container: Ref<HTMLElement>, bounds: Ref<DOMRect>) {
	const chatStore = useChatStore();

	// Detect User Input
	useEventListener(container, "wheel", () => data.userInput++);

	/**
	 * Scrolls the chat to the bottom
	 */
	function scrollToLive() {
		if (!container.value || data.paused) {
			return;
		}

		data.sys = true;

		container.value.scrollTo({
			top: container.value.scrollHeight,
		});

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

		chatStore.messages.push(...data.buffer);
		data.buffer.length = 0;

		nextTick(() => {
			data.init = false;
			scrollToLive();
		});
	}

	// Handle system scroll
	useEventListener(container, "scroll", () => {
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
	});

	return {
		scroll: data,
		scrollToLive,
		pauseScrolling,
		unpauseScrolling,
	};
}
