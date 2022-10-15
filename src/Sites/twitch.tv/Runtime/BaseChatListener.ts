import { Subject } from 'rxjs';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';
import { MessagePatcher } from 'src/Sites/twitch.tv/Util/MessagePatcher';
import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';


export abstract class BaseTwitchChatListener {
	/** Create a Twitch instance bound to this listener */
	protected twitch = this.page.twitch;

	protected killed = new Subject<void>();

	constructor(protected page: TwitchPageScript) {
		(window as any).twitch = this.twitch;
	}

	abstract start(): void;
	abstract listen(): void;
	abstract sendSystemMessage(message: string): void;

	/**
	 * Renders the user's display name with a custom 7TV paint effect if they have one.
	 * Otherwise, use render their name with their assigned Twitch color.
	 */
	renderPaintOnNametag(
		user: { id: string },
		messageElement: Element,
		originalColor: string,
		userNameQuery: string
	) {
		const userID = parseInt(user.id);

		// Add custom paint.
		const paintMap = this.page.site.paintMap;
		if (user && paintMap.has(userID)) {
			const paintID = paintMap.get(userID);

			if (typeof paintID !== 'number') {
				return undefined;
			}

			const paint = this.page.site.paints[paintID];
			const username = messageElement.querySelector<HTMLAnchorElement>(userNameQuery);
			username?.setAttribute('data-seventv-paint', paintID.toString());

			// No paint color? Use Twitch assigned color.
			if (!paint.color && originalColor && username) {
				username.style.color = originalColor;
			}
		}
	}

	/**
	 * Prepares the message patcher with all the items SevenTV will replace/rerender
	 * in the message. Searches for any recognized emotes and records them for rendering later.
	 */
	prepareMessageRender(
		message: Twitch.ChatMessage | Twitch.VideoChatComment,
		additionalConfigs: {},
		live?: boolean
	): MessagePatcher {
		// Push emotes to seventv.emotes property
		const patcher = new MessagePatcher(this.page, message);
		message.seventv = {
			patcher,
			parts: [],
			badges: [],
			words: [],
			live: live,
			...additionalConfigs
		};

		// Tokenize 7TV emotes to Message Data
		// This detects/matches 7TV emotes as text and adds it to a seventv namespace within the message
		patcher.tokenize();

		return patcher;
	}

	kill(): void {
		this.killed.next(undefined);
		this.killed.complete();
	}
}
