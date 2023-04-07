import { nextTick, reactive, toRef, watch } from "vue";
import { useTimeoutFn } from "@vueuse/core";
import { ChatMessage, ChatMessageModeration, ChatUser } from "@/common/chat/ChatMessage";
import { useChatScroller } from "./useChatScroller";
import { ChannelContext } from "../channel/useChannelContext";
import { useConfig } from "../useSettings";

const scrollDuration = useConfig<number>("chat.smooth_scroll_duration");
const lineLimit = useConfig<number>("chat.line_limit", 150);

interface ChatMessages {
	// Message Data
	displayed: ChatMessage[];
	displayedByUser: Record<string, Record<string, ChatMessage>>;
	awaited: Map<string, (v: ChatMessage) => void>;
	buffer: ChatMessage[];

	moderated: {
		id: symbol;
		messages: ChatMessage[];
		victim: ChatUser;
		mod: ChatMessageModeration;
	}[];
	chatters: Record<string, ChatUser>;
	chattersByUsername: Record<string, ChatUser>;
	overflowLimit: number;

	twitchHandlers: Set<(v: Twitch.AnyMessage) => void>;

	// Functions
	sendMessage: (msg: string) => void;
}

let flushTimeout: number | undefined;

const batchTimeMs = useConfig<number>("chat.message_batch_duration");

const m = new WeakMap<ChannelContext, ChatMessages>();

export function useChatMessages(ctx: ChannelContext) {
	let data = m.get(ctx)!;
	if (!data) {
		data = reactive<ChatMessages>({
			// Message Data
			displayed: [] as ChatMessage[],
			displayedByUser: {} as Record<string, Record<string, ChatMessage>>,
			awaited: new Map<string, (v: ChatMessage) => void>(),
			buffer: [] as ChatMessage[],
			moderated: [] as {
				id: symbol;
				messages: ChatMessage[];
				victim: ChatUser;
				mod: ChatMessageModeration;
			}[],
			chatters: {} as Record<string, ChatUser>,
			chattersByUsername: {} as Record<string, ChatUser>,
			overflowLimit: 0,

			twitchHandlers: new Set<(v: Twitch.AnyMessage) => void>(),

			// Functions
			sendMessage: (() => {
				return;
			}) as (msg: string) => void,
		});

		m.set(ctx, data);

		// Unbuffer paused messages
		nextTick(() => {
			watch(
				() => scroller.paused,
				(v, old) => {
					if (v && !old) return;

					// Chat Unpaused
					// Move the messages in the pause buffer to the main buffer
					const incr = Math.ceil(scroller.pauseBuffer.length / 32);
					let n = 0;
					while (scroller.pauseBuffer.length) {
						const unbuf = scroller.pauseBuffer.splice(0, 50);
						n += incr;

						useTimeoutFn(() => {
							data.displayed = data.displayed.concat(unbuf);
						}, n);
					}

					useTimeoutFn(() => {
						scroller.scrollToLive();
					}, n + incr);
				},
			);
		});
	}

	const scroller = useChatScroller(ctx);

	/**
	 * Add a message to the chat
	 *
	 * It will be first added to a buffer, queued for rendering
	 * and will render in batch with other buffered messages
	 *
	 * @param message the message to queue up
	 */
	function add<T extends ChatMessage>(message: T, now?: boolean): void {
		if (scroller.paused) {
			// if scrolling is paused, buffer the message
			scroller.pauseBuffer.push(message);
			if (scroller.pauseBuffer.length > lineLimit.value) scroller.pauseBuffer.shift();

			return;
		}

		// check user/message author data
		if (message.author) {
			message.author.lastMsgId = message.sym;

			const knownAuthor = data.chatters[message.author.id];
			if (!knownAuthor) {
				data.chatters[message.author.id] = message.author;
			} else {
				knownAuthor.username = message.author.username;
				knownAuthor.displayName = message.author.displayName;
				knownAuthor.color = message.author.color;
				knownAuthor.intl = message.author.intl;
			}

			// set as active chatter
			if (!data.chatters[message.author.id] || !data.chattersByUsername[message.author.username]) {
				data.chatters[message.author.id] = message.author;
				if (message.author.username) data.chattersByUsername[message.author.username] = message.author;
			}

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

		flush(now);
	}

	/**
	 * Clears the chat messages
	 */
	function clear() {
		data.displayed.length = 0;
		data.buffer.length = 0;
		data.chatters = {};
	}

	/**
	 * Flushes the message buffer, pushing messages to the render queue
	 * and removing rendered messages that have gone out of the live buffer's bounds
	 */
	function flush(force?: boolean): void {
		if (flushTimeout) return;

		flushTimeout = window.setTimeout(() => {
			if (scroller.paused) {
				flushTimeout = undefined;
				return;
			}

			if (scroller.init == true) scroller.init = false;

			// push new messages
			if (data.buffer.length > 0) {
				const unbuf = data.buffer.splice(0, data.buffer.length);

				// push to the render queue all unbuffered messages
				data.displayed.push(...unbuf);
			}

			// scroll to the bottom on the next tick
			nextTick(() => scroller.scrollToLive(scrollDuration.value));

			// remove messages beyond the buffer
			const overflowLimit = lineLimit.value * 1.25;
			if (data.displayed.length > overflowLimit) {
				flushTimeout = window.setTimeout(() => {
					const removed = data.displayed.splice(0, data.displayed.length - lineLimit.value);
					for (const msg of removed) {
						if (!msg.author) continue;

						// retrieve the user's message map
						const umap = data.displayedByUser[msg.author.username];
						if (!umap) continue;

						// delete this specific message from the user's message map
						delete umap[msg.id];
					}

					flushTimeout = undefined;
				}, (force ? 5 : batchTimeMs.value) / 1.5);
			} else {
				flushTimeout = undefined;
			}
		}, (force ? 5 : batchTimeMs.value) / 2);
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
		const len = data.displayed.length + scroller.pauseBuffer.length;
		const bufferStart = data.displayed.length;

		const result = [] as ChatMessage[];

		for (let i = len - 1; i >= 0; i--) {
			const msg = i >= bufferStart ? scroller.pauseBuffer[i - bufferStart] : data.displayed[i];
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
	async function awaitMessage(id: string, timeout = 1e4): Promise<ChatMessage> {
		return new Promise((resolve, reject) => {
			// Check displayed and buffer if message has already been pushed.
			const displayedMessage = data.displayed.find((msg) => {
				return msg.id === id;
			});
			if (displayedMessage) return resolve(displayedMessage);

			const bufferMessage = data.buffer.find((msg) => {
				return msg.id === id;
			});
			if (bufferMessage) return resolve(bufferMessage);

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

	return reactive({
		displayed: toRef(data, "displayed"),
		handlers: data.twitchHandlers,
		chatters: toRef(data, "chatters"),
		chattersByUsername: toRef(data, "chattersByUsername"),
		moderated: toRef(data, "moderated"),
		sendMessage: toRef(data, "sendMessage"),
		find,
		messagesByUser,
		awaitMessage,
		add,
		clear,
	});
}
