import { nextTick, reactive, toRef } from "vue";
import { useChatScroller } from "./useChatScroller";

const data = reactive({
	// Message Data
	displayed: [] as Twitch.DisplayableMessage[],
	buffer: [] as Twitch.DisplayableMessage[],
	pauseBuffer: [] as Twitch.DisplayableMessage[], // twitch chat message buffe when scrolling is paused
	byUser: {} as Record<string, Record<string, Twitch.DisplayableMessage>>,
	chatters: {} as Record<string, Record<string, never>>,

	handlers: new Set<(v: Twitch.AnyMessage) => void>(),

	// Functions
	sendMessage: (() => {
		return;
	}) as (msg: string) => void,
});

let flushTimeout: number | undefined;

const { init, paused, lineLimit, scrollToLive, duration } = useChatScroller();

/**
 * Add a message to the chat
 *
 * It will be first added to a buffer, queued for rendering
 * and will render in batch with other buffered messages
 *
 * @param message the message to queue up
 */
function add<T extends Twitch.DisplayableMessage>(message: T): void {
	if (paused.value) {
		// if scrolling is paused, buffer the message
		data.pauseBuffer.push(message);
		if (data.pauseBuffer.length > lineLimit.value) data.pauseBuffer.shift();

		return;
	}

	// check user/message author data
	if (message.user) {
		if (!data.chatters[message.user.userID]) data.chatters[message.user.userID] = {}; // set as active chatter
		if (!data.byUser[message.user.userLogin]) data.byUser[message.user.userLogin] = {}; // create user message map

		// add message to user message map
		data.byUser[message.user.userLogin][message.id] = message;
	}

	// push message to buffer, and trigger flush
	data.buffer.push(message);
	flush();
}

/**
 * Clears the chat messages
 */
function clear() {
	data.displayed = [];
	data.buffer = [];
}

/**
 * Flushes the message buffer, pushing messages to the render queue
 * and removing rendered messages that have gone out of the live buffer's bounds
 */
function flush(): void {
	if (flushTimeout) return;

	flushTimeout = window.setTimeout(() => {
		if (paused.value) {
			flushTimeout = undefined;
			return;
		}

		init.value = false;

		// remove messages beyond the buffer
		const overflowLimit = lineLimit.value * 1.25;
		if (data.displayed.length > overflowLimit) {
			const removed = data.displayed.splice(0, data.displayed.length - lineLimit.value);
			for (const msg of removed) {
				if (!msg.user) continue;

				// retrieve the user's message map
				const umap = data.byUser[msg.user.userLogin];
				if (!umap) continue;

				// delete this specific message from the user's message map
				delete umap[msg.id];
			}
		}

		// push new messages
		flushTimeout = window.setTimeout(() => {
			if (data.buffer.length > 0) {
				const unbuf = data.buffer.splice(0, data.buffer.length);

				// push to the render queue all unbuffered messages
				for (const msg of unbuf) {
					data.displayed.push(msg);
				}
			}

			// scroll to the bottom on the next tick
			nextTick(() => scrollToLive(duration.value));

			flushTimeout = undefined;
		}, 25);
	}, 25);
}

/**
 * Finds a message that matches the predicate
 *
 * @param predicate predicate function
 * @param all if true, returns all messages that match the predicate
 * @returns message that matches the predicate
 * @returns list of messages that match the predicate
 * @returns null if no message matches the predicate
 */
function find<A extends boolean = false>(predicate: (msg: Twitch.DisplayableMessage) => boolean, all?: A) {
	const len = data.displayed.length + data.pauseBuffer.length;
	const bufferStart = data.displayed.length;

	const result = [] as Twitch.DisplayableMessage[];

	for (let i = len - 1; i >= 0; i--) {
		const msg = i >= bufferStart ? data.pauseBuffer[i - bufferStart] : data.displayed[i];
		if (!msg) continue;

		if (predicate(msg)) {
			result.push(msg);
			if (!all) break;
		}
	}

	return (all ? result : result[0] ?? null) as A extends true
		? Twitch.DisplayableMessage[]
		: Twitch.DisplayableMessage | null;
}

/**
 * Returns a list of messages by the specified user
 *
 * @param userLogin user's login name
 * @returns list of messages by the user
 */
function messagesByUser(userLogin: string): Twitch.DisplayableMessage[] {
	const umap = data.byUser[userLogin];
	if (!umap) return [];

	return Object.values(umap);
}

function setMessageSender(fn: (msg: string) => void) {
	data.sendMessage = fn;
}

export function useChatMessages() {
	return reactive({
		displayed: toRef(data, "displayed"),
		handlers: data.handlers,
		chatters: data.chatters,
		pauseBuffer: data.pauseBuffer,
		sendMessage: data.sendMessage,
		find,
		messagesByUser,
		add,
		setMessageSender,
		clear,
	});
}
