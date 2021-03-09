import { from, Observable, of } from 'rxjs';
import { concatMap, mapTo, map, concatAll, filter, tap, mergeAll, takeLast } from 'rxjs/operators';
import { Logger } from 'src/Logger';
import { Page } from 'src/Page/Page';
import { BadgeManager } from 'src/Page/Util/BadgeManager';
import { MessagePatcher } from 'src/Page/Util/MessagePatcher';
import { Twitch } from 'src/Page/Util/Twitch';


export class ChatListener extends Observable<Twitch.ChatMessage> {
	/** Create a Twitch instance bound to this listener */
	private twitch = new Twitch();

	/** A list of message IDs which have been received but not yet rendered on screen */
	private pendingMessages = [] as string[];

	private badgeManager = new BadgeManager();

	constructor() {
		super(observer => {
			Logger.Get().info('Listening for chat messages');

			// Begin listening to incoming messages
			this.twitch.getChatController().props.messageHandlerAPI.addMessageHandler(msg => {
				if (msg.messageType !== 0) return undefined;

				/**
				 * Push new messages as "pending" while we are waiting for Twitch to create the component
				 * We can edit the message in the meantime
				 * @see observeDOM()
				 */
				this.pendingMessages.push(msg.id);

				// Push emotes to seventv.emotes property
				const patcher = new MessagePatcher(msg, Page.EmoteSet);
				msg.seventv = {
					emotes: [],
					badges: [],
					patcher
				};

				// Tokenize 7TV emotes to Message Data
				// This detects/matches 7TV emotes as text and adds it to a seventv namespace within the message
				patcher.tokenize();

				// Emit the message
				observer.next(msg);
			});
		});

		/**
		 * OBSERVE THE DOM AND GET ADDED COMPONENTS
		 */
		this.observeDOM().pipe(
			// Patch with badges LUL
			tap(line => this.badgeManager.patchChatLine(line)),

			// Render 7TV emotes
			tap(line => line.component.setState(line.component.state))
		).subscribe();

		const chat = this.twitch.getChat();
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
			const onMutate = (mutations: MutationRecord[]) => {
				from(mutations).pipe(
					map(mutation => ({ mutation, nodes: [] as HTMLDivElement[] })), // Get added nodes only
					concatMap(({ mutation, nodes }) => of(mutation.addedNodes.forEach((n: any) => nodes.push(n as HTMLDivElement))).pipe(
						mapTo(nodes)
					)),
					concatAll(), // Stream elements in order
					filter(el => el.classList?.contains('chat-line__message')), // Only get messages

					takeLast(1),
					map(() => this.twitch.getChatLines(this.pendingMessages)), // Get component & element of pending messages
					mergeAll(), // Remove the IDs from pending messages
					tap(msg => this.pendingMessages.splice(this.pendingMessages.indexOf(msg.component?.props?.message.id), 1)),
					tap(() => console.log('pending size', this.pendingMessages.length))
				).subscribe({ // Emit the line
					next(line) { observer.next(line); }
				});
			};

			const mutationObserver = new MutationObserver(onMutate);
			mutationObserver.observe(this.twitch.getChat().state.chatListElement, {
				childList: true, subtree: true, attributes: true
			});
		});
	}
}
