import { nextTick, reactive, toRefs } from "vue";
import { useChatScroller } from "./useChatScroller";

const data = reactive({
	// Message Data
	messages: [] as Twitch.DisplayableMessage[],
	messageBuffer: [] as Twitch.DisplayableMessage[],
	chatters: {} as Record<string, object>,

	messageHandlers: new Set<(v: Twitch.AnyMessage) => void>(),

	// Functions
	sendMessage: (() => {
		return;
	}) as (msg: string) => void,
});

let flushTimeout: number | undefined;

const { init, paused, buffer: scrollBuffer, lineLimit, scrollToLive, duration } = useChatScroller();

function addMessage(message: Twitch.DisplayableMessage): void {
	if (paused.value) {
		// if scrolling is paused, buffer the message
		scrollBuffer.value.push(message as Twitch.DisplayableMessage);
		if (scrollBuffer.value.length > lineLimit.value) scrollBuffer.value.shift();

		return;
	}

	if (message.user && !data.chatters[message.user.userID]) {
		data.chatters[message.user.userID] = {};
	}

	data.messageBuffer.push(message);

	flush();
}

function clear() {
	data.messages = [];
	data.messageBuffer = [];
}

function flush(): void {
	if (flushTimeout) return;

	flushTimeout = window.setTimeout(() => {
		if (paused.value) {
			flushTimeout = undefined;
			return;
		}

		init.value = false;

		const overflowLimit = lineLimit.value * 1.25;
		if (data.messages.length > overflowLimit) {
			data.messages.splice(0, data.messages.length - lineLimit.value);
		}

		flushTimeout = window.setTimeout(() => {
			if (data.messageBuffer.length > 0) {
				const unbuf = data.messageBuffer.splice(0, data.messageBuffer.length);

				for (const msg of unbuf) {
					data.messages.push(msg);
				}
			}

			nextTick(() => scrollToLive(duration.value));

			flushTimeout = undefined;
		}, 25);
	}, 25);
}

export function useChatMessages() {
	const { messages, messageHandlers, chatters, sendMessage } = toRefs(data);

	return {
		messages: messages,
		messageHandlers: messageHandlers,
		chatters: chatters,
		sendMessage: sendMessage,
		addMessage,
		clear,
	};
}
