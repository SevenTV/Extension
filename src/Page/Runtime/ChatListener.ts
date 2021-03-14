import { from, Observable, of, Subject } from 'rxjs';
import { concatMap, mapTo, map, concatAll, filter, tap, mergeAll, takeLast, mergeMap } from 'rxjs/operators';
import { Logger } from 'src/Logger';
import { Page } from 'src/Page/Page';
import { BadgeManager } from 'src/Page/Util/BadgeManager';
import { MessagePatcher } from 'src/Page/Util/MessagePatcher';
import { Twitch } from 'src/Page/Util/Twitch';


export class ChatListener extends Observable<Twitch.ChatMessage> {
	/** Create a Twitch instance bound to this listener */
	private twitch = new Twitch();

	/** A list of message IDs which have been received but not yet rendered on screen */
	private pendingMessages = new Set<string>();
	private badgeManager = new BadgeManager();

	constructor() {
		super(observer => {
			Logger.Get().info('Listening for chat messages');

			// Begin listening to incoming messages
			this.twitch.getChatController().props.messageHandlerAPI.addMessageHandler(msg => {
				/// console.log('hi', msg);
				if (msg.messageType !== 0) return undefined;

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
					words: []
				};

				// Tokenize 7TV emotes to Message Data
				// This detects/matches 7TV emotes as text and adds it to a seventv namespace within the message
				patcher.tokenize();

				// Emit the message
				observer.next(msg);
			});
		});

		(window as any).twitch = this.twitch;

		/**
		 * OBSERVE THE DOM AND GET ADDED COMPONENTS
		 */
		this.observeDOM().pipe(
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

	constructStringMsgBody(msg: Twitch.ChatMessage): string {
		return (msg.messageParts.map(p => {
			switch (p.type) {
				case 0:
					return p.content as string;

				case 6:
					return (p.content as any).alt;

				default:
					break;
			}
		}) as string[]).join('');
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

				// Find removed nodes
			});

			const container = this.twitch.getChat().state.chatListElement.querySelector('.chat-scrollable-area__message-container');
			if (!container) throw new Error('Could not find chat container');

			mutationObserver.observe(container, {
				childList: true
			});
		});
	}
}
