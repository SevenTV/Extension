import { Constants } from '@typings/src/Constants';
import { DataStructure } from '@typings/typings/DataStructure';
import { Observable } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';
import { Logger } from 'src/Logger';
import { emoteStore } from 'src/Sites/app/SiteApp';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';
import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';
import { intervalToDuration, formatDuration } from 'date-fns';
import { BaseTwitchChatListener } from 'src/Sites/twitch.tv/Runtime/BaseChatListener';

let currentHandler: (msg: Twitch.ChatMessage) => void;
let currentModHandler: (msg: Twitch.ChatMessage) => void;
export class TwitchChatListener extends BaseTwitchChatListener {

	/** A list of message IDs which have been received but not yet rendered on screen */
	private pendingMessages = new Set<string>();

	linesRendered = 0;
	lastModMessage = '';

	constructor(page: TwitchPageScript) {
		super(page);
	}

	start(): void {
		// Detect rerenders
		const listener = this; // Get class context to pass it into the function
		const x = this.twitch.getChatController().componentDidUpdate; // Get current componentDidUpdate()

		if (!this.page.ffzMode) {
			const controller = this.twitch.getChatController();
			if (!!controller) {
				controller.componentDidUpdate = function (a, b) {
					if (listener.page.ffzMode) {
						return;
					}

					Logger.Get().debug(`Twitch chat rerender detected, rendering 7TV emotes`);
					setTimeout(() => listener.rerenderAll(listener.twitch.getChatLines()), 1000); // Rerender all existing chat lines

					if (!!x && typeof x === 'function') {
						try {
							x.apply(this, [a, b]); // Pass the execution on
						} catch (err) {
							console.error(err);
						}
					}
				};

				// Handle kill
				this.killed.subscribe({
					next: () => {
						controller.componentDidUpdate = x;
					}
				});
			}
		}
	}

	listen(): void {
		Logger.Get().info('Listening for chat messages');
		const msgHandler = this.twitch.getChatController().props.messageHandlerAPI;
		if (!!currentHandler) {
			Logger.Get().info('Unloading previous handler');
			msgHandler.removeMessageHandler(currentHandler);
			msgHandler.removeMessageHandler(currentModHandler);
		}

		// Add a handler for regular chat messages
		currentHandler = msg => {
			if (this.page.ffzMode) return undefined;
			if (msg.messageType !== 0 && msg.messageType !== 1) return undefined;
			this.onMessage(msg);
		};
		msgHandler.addMessageHandler(currentHandler);

		// Add a handler for moderation messages
		currentModHandler = (msg) => {
			if (msg.type !== 2) return undefined;
			if (!this.page.site.config.get('general.display_mod_actions')?.asBoolean()) {
				return undefined; // Don't emit a mod message, as the setting is disabled
			}
			if (this.page.isActorModerator) {
				return undefined; // Don't emit a message if the actor is a moderator
			}
			const modMsg = msg as unknown as Twitch.ChatMessage.ModerationMessage;
			const h = `${modMsg.userLogin}.${modMsg.moderationType}.${modMsg.duration}`;
			if (this.lastModMessage === h) {
				return undefined; // skip if this is duplicate
			}

			if (modMsg.moderationType === 1) { // Timeout
				const humanizedInterval = formatDuration(intervalToDuration({start: 0, end: modMsg.duration * 1000}));
				this.sendSystemMessage(`${modMsg.userLogin} was timed out for ${humanizedInterval}${!!modMsg.reason ? ` (${modMsg.reason})` : ''}`, true);
			} else if (modMsg.moderationType === 0) { // Ban
				this.sendSystemMessage(`${modMsg.userLogin} was permanently banned`, true);
			} else if (modMsg.moderationType === 2) { // Message deleted
				this.sendSystemMessage(`A message from ${modMsg.userLogin} was deleted`, true);
			}
			this.lastModMessage = h;
		};
		msgHandler.addMessageHandler(currentModHandler);

		// Send twitch emotes to upper layer
		const twitchEmotes = this.twitch.getChat()?.props.emotes;
		if (Array.isArray(twitchEmotes)) {
			this.insertTwitchGlobalEmotesToSet(twitchEmotes);
		}

		/**
		 * OBSERVE THE DOM AND GET ADDED COMPONENTS
		 */
		this.observeDOM().pipe(
			takeUntil(this.killed),
			tap(line => {
					this.page.banSliderManager.considerSlider( line );
			}),
			filter(line => !!line.component),
			// Render 7TV emotes
			tap(line => {
				this.renderNametagPaint(line);

				if (!!line.component.props.message?.seventv) {
					line.component.props.message.seventv.currenUserID = line.component.props.currentUserID;
					line.component.props.message.seventv.currentUserLogin = line.component.props.currentUserLogin;
					line.component.props.message.seventv.patcher?.render(line);
				}
			}),
		).subscribe();
	}

	/**
	 * Re-render messages with 7TV
	 */
	private rerenderAll(lines: Twitch.ChatLineAndComponent[]): void {
		for (const line of lines) {
			if (!line.component?.props) continue;
			this.onMessage(line.component.props.message, line);
			this.renderNametagPaint(line);
		}
	}

	/**
	 * Patch a chat line with a nametag paint when applicable
	 */
	renderNametagPaint(line: Twitch.ChatLineAndComponent): void {
		if (!line.component.props || !line.component.props.message) {
			return undefined;
		}

		const user = line.component.props.message.user;

		super.renderPaintOnNametag(
			{ id: user.userID },
			line.element,
			user.color,
			'[data-a-target="chat-message-username"], .chat-line__username'
		);
	}

	private onMessage(msg: Twitch.ChatMessage, renderAs: Twitch.ChatLineAndComponent | null = null): void {
		/**
		 * Push new messages as "pending" while we are waiting for Twitch to create the component
		 * We can edit the message in the meantime
		 * @see observeDOM()
		 */
		this.pendingMessages.add(msg.id);

		const patcher = super.prepareMessageRender(
			msg,
			{ is_slash_me: msg.messageType === 1 },
			true
		);

		this.linesRendered++;
		if (this.linesRendered === 1) {
			setTimeout(() => this.onMessage(msg), 100);
		}
		if (!!renderAs) {
			patcher.render(renderAs);
		}
	}

	sendSystemMessage(msg: string, hidePrefix?: boolean): void {
		const controller = this.twitch.getChatController();

		if (controller) {
			const id = Date.now().toString();
			const text = msg.replace(/\$currentChannel/g, controller.props.channelLogin);
			controller.pushMessage({
				id,
				msgid: id,
				channel: `#${controller.props.channelLogin}`,
				type: 32,
				message: `${hidePrefix ? '' : '[7TV] '}${text}`
			});
		}
	}

	/**
	 * Observe the DOM for additions and get message components of pending messages
	 */
	observeDOM(): Observable<Twitch.ChatLineAndComponent> {
		return new Observable<Twitch.ChatLineAndComponent>(observer => {
			Logger.Get().info('Creating MutationObserver');

			const mutationObserver = new MutationObserver(mutations => {
				for (const m of mutations) {
					for (const n of m.addedNodes) {
						const r = this.twitch.getChatLine(n as HTMLElement);

						observer.next({
							element: n as HTMLDivElement,
							component: r.component as Twitch.ChatLineComponent,
							inst: r.instance
						});
					}
				}
			});

			const container = this.twitch.getChat().state.chatListElement.querySelector('.chat-scrollable-area__message-container');
			if (!container) throw new Error('Could not find chat container');

			mutationObserver.observe(container, {
				childList: true
			});
		});
	}

	insertTwitchGlobalEmotesToSet(emoteSets: Twitch.TwitchEmoteSet[]): void {
		// Iterate through sets, and start adding to our twitch set
		const emotes = [] as DataStructure.Emote[];
		for (const twset of emoteSets) {
			for (const emote of twset.emotes) {
				emotes.push({
					id: emote.id,
					name: emote.token,
					visibility: 0,
					provider: 'TWITCH',
					status: Constants.Emotes.Status.LIVE,
					tags: [],
					width: [28, 56, 112, 112],
					height: [28, 56, 112, 112],
					owner: !!twset.owner ? {
						id: twset.owner.id,
						display_name: twset.owner.displayName,
						login: twset.owner.login
					} as DataStructure.TwitchUser : undefined
				});
			}
		}

		// Delete the twitch set if it already existed then recreate it
		if (emoteStore.sets.has('twitch')) {
			emoteStore.sets.delete('twitch');
		}
		emoteStore.enableSet(`twitch`, emotes);
	}
}
