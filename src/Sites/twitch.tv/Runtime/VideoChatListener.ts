import { Observable } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';
import { Logger } from 'src/Logger';
import { BaseTwitchChatListener } from 'src/Sites/twitch.tv/Runtime/BaseChatListener';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';
import { MessagePatcher } from 'src/Sites/twitch.tv/Util/MessagePatcher';
import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';


/**
 * Chat listener specifically for handling VODs, clips, and other videos.
 * Unfortunately, Twitch's React components and DOM for video chats
 * are too different from the ones used for live stream chats,
 * therefore requiring this listener.
 */
export class TwitchVideoChatListener extends BaseTwitchChatListener {

	constructor(page: TwitchPageScript) {
		super(page);
	}

	start(): void {
		const listener = this;

		// Handle changes only if FFZ isn't enabled.
		if (!this.page.ffzMode) {

			Logger.Get().debug('Twitch video chat rerender detected, rendering 7TV emotes');
			this.renderAll(listener.twitch.getVideoMessages());
		}
	}

	listen(): void {

		// Let FFZ handle things if it's available.
		if (this.page.ffzMode) {
			return;
		}

		Logger.Get().info('Listen for new video chat messages.');

		this.observeDOM().pipe(
			takeUntil(this.killed),
			filter(message => !!message.component),  // Ignore messages with no component states, like subs/resubs.
			tap(message => {
				this.renderPaintOnNametag(message);
				this.onMessage(message);
			})
		).subscribe();
	}

	private renderAll(messages: Twitch.VideoMessageAndComponent[]): void {
		for (const message of messages) {
			if (!message.component?.props) {
				continue;
			}

			this.onMessage(message);
			this.renderPaintOnNametag(message);
		}
	}

	renderPaintOnNametag(message: Twitch.VideoMessageAndComponent) {

		const props = message.component.props;
		if (!props || !props.context) {
			return undefined;
		}

		const user = props.context.author;
		const userID = parseInt(user.id);

		// Add custom paint.
		const paintMap = this.page.site.paintMap;
		if (user && paintMap.has(userID)) {
			const paintID = paintMap.get(userID);

			if (typeof paintID !== 'number') {
				return undefined;
			}

			const paint = this.page.site.paints[paintID];
			const username = message.element.querySelector<HTMLAnchorElement>('.video-chat__message-author');
			username?.setAttribute('data-seventv-paint', paintID.toString());

			// No paint color? Use Twitch assigned color.
			const userColor = props.context.comment.message.userColor;
			if (!paint.color && userColor && username) {
				username.style.color = userColor;
			}
		}
	}

	private onMessage(message: Twitch.VideoMessageAndComponent): void {
		const context = message.component.props.context;
		if (!context) {
			return;
		}

		const author = context.author;
		const patcher = new MessagePatcher(this.page, context.comment);
		context.comment.seventv = {
			patcher,
			parts: [],
			badges: [],
			words: [],
			currenUserID: author.id,
			currentUserLogin: author.name
		};

		patcher.tokenize();
		patcher.render(message);
	}

	sendSystemMessage(_: string): void {

	}

	/**
	 * Watch for new chat comments.
	 */
	observeDOM(): Observable<Twitch.VideoMessageAndComponent> {

		const getVideoChatList = () => document.querySelectorAll(`${Twitch.Selectors.VideoChatContainer} div.video-chat__message-list-wrapper > div > ul`)?.[0];

		return new Observable<Twitch.VideoMessageAndComponent>(subscriber => {
			Logger.Get().info('Creating MutationObserver for video chat list.');

			let chatList: Element;

			// Create method for setting up a chat list item add observable.
			const setupChatListObservable = () => {

				// Start looking for new chat items to be added.
				const chatListObserver = new MutationObserver(mutations => {
					for (const mutation of mutations) {
						for (const node of mutation.addedNodes) {
							const message = (node as HTMLElement).querySelectorAll<HTMLElement>(Twitch.Selectors.VideoChatMessage)[0];
							if (!message) {
								continue;
							}

							const component = this.twitch.getVideoChatMessage(message);

							subscriber.next({
								element: node as HTMLDivElement,
								component: component.component as Twitch.VideoMessageComponent,
								inst: component.instance
							});
						}
					}
				});

				chatListObserver.observe(
					chatList,
					{
						childList: true
					}
				);
			};

			// Check if the chat list exists in the DOM yet.
			chatList = getVideoChatList();

			// Already does? Setup the observable.
			if (chatList) {
				setupChatListObservable();
			}

			// Otherwise, until video chat container is lazy loaded to the DOM.
			else {
				const domObserver = new MutationObserver(mutations => {
					for (const mutation of mutations) {
						for (const node of mutation.addedNodes) {

							// Check if the node added is the video chat container.
							if (
								node.nodeName === 'UL' &&
								getVideoChatList()
							) {

								// Stop watching for the chat list to be added.
								domObserver.disconnect();

								// Now start watching for new items.
								chatList = node as Element;
								setupChatListObservable();
							}
						}
					}
				});

				domObserver.observe(
					document.body,
					{
						childList: true,
						subtree: true,
						attributes: false
					}
				);
			}
		});
	}
}
