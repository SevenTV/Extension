import { computed, nextTick, reactive, toRef } from "vue";
import { useTimeoutFn } from "@vueuse/core";
import { ChatMessage } from "@/common/chat/ChatMessage";
import { useChatProperties } from "./useChatProperties";
import { useChatScroller } from "./useChatScroller";
import { useConfig } from "../useSettings";

const data = reactive({
	// Message Data
	displayed: [] as ChatMessage[],
	displayedByUser: {} as Record<string, Record<string, ChatMessage>>,
	awaited: new Map<string, (v: ChatMessage) => void>(),
	buffer: [] as ChatMessage[],
	pauseBuffer: [] as ChatMessage[], // twitch chat message buffe when scrolling is paused
	chatters: {} as Record<string, Record<string, never>>,

	twitchHandlers: new Set<(v: Twitch.AnyMessage) => void>(),

	// Functions
	sendMessage: (() => {
		return;
	}) as (msg: string) => void,
});

let flushTimeout: number | undefined;

const scroller = useChatScroller();
const properties = useChatProperties();
const overflowLimit = computed(() => scroller.lineLimit * 1.25);
const batchTimeMs = useConfig<number>("chat.message_batch_duration");

/**
 * Add a message to the chat
 *
 * It will be first added to a buffer, queued for rendering
 * and will render in batch with other buffered messages
 *
 * @param message the message to queue up
 */
function add<T extends ChatMessage>(message: T): void {
	if (scroller.paused) {
		// if scrolling is paused, buffer the message
		data.pauseBuffer.push(message);
		if (data.pauseBuffer.length > scroller.lineLimit) data.pauseBuffer.shift();

		return;
	}

	// check user/message author data
	if (message.author) {
		// check blocked state and ignore if blocked
		if (properties.blockedUsers.has(message.author.id)) return;

		if (!data.chatters[message.author.id]) data.chatters[message.author.id] = {}; // set as active chatter
		if (!data.displayedByUser[message.author.username]) data.displayedByUser[message.author.username] = {}; // create user message map

		// add message to user message map
		data.displayedByUser[message.author.username][message.id] = message;
	}

	// push message to buffer, and trigger flush
	data.buffer.push(message);

	if (data.awaited.has(message.id)) {
		data.awaited.get(message.id)!(message);
		data.awaited.delete(message.id);
	}

	flush();
}

/**
 * Clears the chat messages
 */
function clear() {
	data.displayed.length = 0;
	data.buffer.length = 0;
}

/**
 * Flushes the message buffer, pushing messages to the render queue
 * and removing rendered messages that have gone out of the live buffer's bounds
 */
function flush(): void {
	if (flushTimeout) return;

	flushTimeout = window.setTimeout(() => {
		if (scroller.paused) {
			flushTimeout = undefined;
			return;
		}

		scroller.init = false;

		// push new messages
		if (data.buffer.length > 0) {
			const unbuf = data.buffer.splice(0, data.buffer.length);

			// push to the render queue all unbuffered messages
			for (const msg of unbuf) {
				data.displayed.push(msg);
			}
		}

		// scroll to the bottom on the next tick
		nextTick(() => scroller.scrollToLive(scroller.duration));

		// remove messages beyond the buffer
		if (data.displayed.length > overflowLimit.value) {
			flushTimeout = window.setTimeout(() => {
				const removed = data.displayed.splice(0, data.displayed.length - scroller.lineLimit);
				for (const msg of removed) {
					if (!msg.author) continue;

					// retrieve the user's message map
					const umap = data.displayedByUser[msg.author.username];
					if (!umap) continue;

					// delete this specific message from the user's message map
					delete umap[msg.id];
				}

				flushTimeout = undefined;
			}, batchTimeMs.value / 1.5);
		} else {
			flushTimeout = undefined;
		}
	}, batchTimeMs.value / 2);
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
function find<A extends boolean = false>(predicate: (msg: ChatMessage) => boolean, all?: A) {
	const len = data.displayed.length + data.pauseBuffer.length;
	const bufferStart = data.displayed.length;

	const result = [] as ChatMessage[];

	for (let i = len - 1; i >= 0; i--) {
		const msg = i >= bufferStart ? data.pauseBuffer[i - bufferStart] : data.displayed[i];
		if (!msg) continue;

		if (predicate(msg)) {
			result.push(msg);
			if (!all) break;
		}
	}

	return (all ? result : result[0] ?? null) as A extends true ? ChatMessage[] : ChatMessage | null;
}

/**
 * Returns a list of messages by the specified user
 *
 * @param userLogin user's login name
 * @returns list of messages by the user
 */
function messagesByUser(userLogin: string): ChatMessage[] {
	const umap = data.displayedByUser[userLogin];
	if (!umap) return [];

	return Object.values(umap);
}

/**
 *
 * @param id the ID of the message to wait for
 * @param timeout the maximum amount of time we will wait
 * @returns
 */
async function awaitMessage(id: string, timeout = 10e3): Promise<ChatMessage> {
	return new Promise((resolve, reject) => {
		const { stop } = useTimeoutFn(() => {
			data.awaited.delete(id);
			reject(Error("Timed out waiting for message"));
		}, timeout);

		data.awaited.set(id, (msg) => {
			resolve(msg);
			stop();
		});
	});
}

function setMessageSender(fn: (msg: string) => void) {
	data.sendMessage = fn;
}

export function useChatMessages() {
	return reactive({
		displayed: toRef(data, "displayed"),
		handlers: data.twitchHandlers,
		chatters: data.chatters,
		pauseBuffer: data.pauseBuffer,
		sendMessage: data.sendMessage,
		find,
		messagesByUser,
		awaitMessage,
		add,
		setMessageSender,
		clear,
	});
}
