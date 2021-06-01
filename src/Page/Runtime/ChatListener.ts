import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'src/Logger';
import { PageScript } from 'src/Page/Page';
import { MessagePatcher } from 'src/Page/Util/MessagePatcher';
import { Twitch } from 'src/Page/Util/Twitch';

let currentHandler: (msg: Twitch.ChatMessage) => void;
export class ChatListener {
	/** Create a Twitch instance bound to this listener */
	private twitch = this.page.twitch;

	/** A list of message IDs which have been received but not yet rendered on screen */
	private pendingMessages = new Set<string>();

	linesRendered = 0;

	constructor(private page: PageScript) {
		(window as any).twitch = this.twitch;
	}

	start(): void {
		// Detect rerenders
		const listener = this; // Get class context to pass it into the function
		const x = this.twitch.getChatController().componentDidUpdate; // Get current componentDidUpdate()

		const controller = this.twitch.getChatController();
		if (!!controller) {
			controller.componentDidUpdate = function(a, b) {
				Logger.Get().debug(`Twitch chat rerender detected, rendering 7TV emotes`);
				listener.rerenderAll(listener.twitch.getChatLines()); // Rerender all existing chat lines

				if (!!x && typeof x === 'function') {
					try {
						x(a, b); // Pass the execution on
					} catch (_) {	}
					// FFZ will not be happy with this for some reason
					// Their error doesn't appear to have adverse effects on the chat experience so we ignore it Okayge
				}
			};
		}
	}

	listen(): void {
		Logger.Get().info('Listening for chat messages');
		const msgHandler = this.twitch.getChatController().props.messageHandlerAPI;
		if (!!currentHandler) {
			Logger.Get().info('Unloading previous handler');
			msgHandler.removeMessageHandler(currentHandler);
		}

		currentHandler = msg => {
			if (msg.messageType !== 0 && msg.messageType !== 1) return undefined;

			this.onMessage(msg);
		};
		msgHandler.addMessageHandler(currentHandler);

		/**
		 * OBSERVE THE DOM AND GET ADDED COMPONENTS
		 */
		this.observeDOM().pipe(
			// Patch with badges LUL
			// tap(line => this.badgeManager.patchChatLine(line)),

			// Render 7TV emotes
			tap(line => line.component.props.message.seventv.patcher?.render(line)),
		).subscribe();
	}

	/**
	 * Re-render messages with 7TV
	 */
	private rerenderAll(lines: Twitch.ChatLineAndComponent[]): void {
		for (const line of lines) {
			if (!line.component?.props) continue;
			this.onMessage(line.component.props.message);
		}
	}

	private onMessage(msg: Twitch.ChatMessage): void {
		/**
		 * Push new messages as "pending" while we are waiting for Twitch to create the component
		 * We can edit the message in the meantime
		 * @see observeDOM()
		 */
		this.pendingMessages.add(msg.id);

		// Push emotes to seventv.emotes property
		const patcher = new MessagePatcher(this.page, msg);
		msg.seventv = {
			patcher,
			parts: [],
			badges: [],
			words: [],
			is_slash_me: msg.messageType === 1
		};

		// Tokenize 7TV emotes to Message Data
		// This detects/matches 7TV emotes as text and adds it to a seventv namespace within the message
		patcher.tokenize();

		this.linesRendered++;
		if (this.linesRendered === 1) {
			setTimeout(() => this.onMessage(msg), 100);
		}
	}

	sendSystemMessage(msg: string): void {
		const controller = this.twitch.getChatController();

		if (controller) {
			const id = Date.now().toString();
			const text = msg.replace(/\$currentChannel/g, controller.props.channelLogin);
			controller.pushMessage({
				id,
				msgid: id,
				channel: `#${controller.props.channelLogin}`,
				type: 32,
				message: `[7TV] ${text}`
			});
		}
	}

	/**
	 * Observe the DOM for additions and get message components of pending messages
	 */
	observeDOM(): Observable<Twitch.ChatLineAndComponent> {
		return new Observable<Twitch.ChatLineAndComponent>(observer => {
			Logger.Get().info('Creating MutationObserver');

			const mutationObserver = new MutationObserver((records) => {
				const lines = this.twitch.getChatLines(Array.from(this.pendingMessages.values()));

				// Check for removed nodes
				const removals = records.map(r => r.removedNodes);
				for (const removedNodes of removals) {
					removedNodes.forEach(n => {
						const el = n as HTMLDivElement;
						if (!el.classList.contains(Twitch.Selectors.ChatLine.slice(1))) return undefined;

						// Send message to content script notifying it to unrender the body of deleted messages
						this.page.sendMessageUp('UnrenderChatLine', { id: el.getAttribute('seventv-id') });
					});
				}

				for (const line of lines) {
					this.pendingMessages.delete(line.component?.props?.message.id);

					observer.next(line);
				}
			});

			const container = this.twitch.getChat().state.chatListElement.querySelector('.chat-scrollable-area__message-container');
			if (!container) throw new Error('Could not find chat container');

			mutationObserver.observe(container, {
				childList: true
			});
		});
	}
}
