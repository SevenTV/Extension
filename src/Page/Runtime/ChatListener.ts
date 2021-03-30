import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { Logger } from 'src/Logger';
import { Page } from 'src/Page/Page';
import { MessagePatcher } from 'src/Page/Util/MessagePatcher';
import { Twitch } from 'src/Page/Util/Twitch';


export class ChatListener extends Observable<Twitch.ChatMessage> {
	/** Create a Twitch instance bound to this listener */
	private twitch = new Twitch();

	/** A list of message IDs which have been received but not yet rendered on screen */
	private pendingMessages = new Set<string>();

	linesRendered = 0;

	constructor() {
		super(observer => {
			Logger.Get().info('Listening for chat messages');

			// Begin listening to incoming messages
			this.twitch.getChatController().props.messageHandlerAPI.addMessageHandler(msg => {
				if (msg.messageType !== 0 && msg.messageType !== 1) return undefined;

				this.onMessage(msg);

				// Emit the message
				observer.next(msg);
			});
		});
		// (window as any).twitch = this.twitch;

		// Detect rerenders
		const listener = this; // Get class context to pass it into the function
		const x = this.twitch.getChatController().componentDidUpdate; // Get current componentDidUpdate()

		this.twitch.getChatController().componentDidUpdate = function(a, b) {
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

		/**
		 * OBSERVE THE DOM AND GET ADDED COMPONENTS
		 */
		this.observeDOM().pipe(
			filter(line => !!line.component.props.message.seventv),
			// Patch with badges LUL
			// tap(line => this.badgeManager.patchChatLine(line)),

			// Render 7TV emotes
			tap(line => line.component.props.message.seventv.patcher?.render(line)),

			// Testing
			// map(line => {
			// 	const { inst, component, element } = line;
			// 	console.log(inst);
			// }),
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
		const patcher = new MessagePatcher(msg, Page.EmoteSet);
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
