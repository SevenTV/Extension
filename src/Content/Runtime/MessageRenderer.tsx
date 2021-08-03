import { Twitch } from 'src/Page/Util/Twitch';
import { App } from 'src/Content/App/App';
import { MessageTree } from 'src/Content/Runtime/MessageTree';
import twemoji from 'twemoji';

export class MessageRenderer {
	private parts = [] as HTMLElement[];
	constructor(
		public app: App,
		public msg: Twitch.ChatMessage,
		public elementId: string
	) { }

	getChatContainer() {
		return document.querySelector(Twitch.Selectors.ChatScrollableContainer);
	}

	getElement(): HTMLDivElement | null {
		return document.getElementById(this.elementId) as HTMLDivElement;
	}

	insert(): void {
		const el = this.getElement();
		if (!el) return undefined;

		// Delete previous message context if it exists
		const currentContext = el.querySelectorAll('.seventv-message-context');
		currentContext.forEach(c => {
			c.remove();
		});

		const container = el.querySelector('.chat-line__no-background') ?? el.querySelector(Twitch.Selectors.ChatMessageContainer) ?? el;
		el.querySelector('.message')?.remove();
		const newContext = document.createElement('span');
		newContext.classList.add('seventv-message-context');
		newContext.style.position = 'relative';

		// Insert message body parts
		for (const part of this.parts) {
			newContext.appendChild(part);
		}
		// Render emojis
		newContext.querySelectorAll('span').forEach(span => {
			if (twemoji.test(span.innerText)) {
				twemoji.parse(span, {
					className: 'seventv-emoji'
				});
				const emojis = span.querySelectorAll('img');
				for (const emoji of Array.from(emojis)) {
					const emoteji = this.app.emotes.fromEmoji(emoji);
					emoji.title = emoteji.name;
					emoji.width = 19.5;
					emoji.height = 19.5;
				}
			}
		});

		// Render user badges
		const authorID = this.msg.user?.userID;
		if (typeof authorID === 'string') {
			(() => {
				const badgeAt = this.app.badgeMap.get(parseInt(authorID)); // Get the badge index ID for this user
				if (typeof badgeAt !== 'number') {
					return undefined;
				}
				const badge = this.app.badges[badgeAt as number]; // Get the badge structure
				if (badge === undefined) {
					return undefined;
				}

				// Append to DOM
				const usernameContainer = container.querySelector(Twitch.Selectors.ChatUsernameContainer); // Chat Line - Username Container
				const badgeContainer = usernameContainer?.children[0]; // Twitch Badge Container

				// Create an application context where 7TV badges will rneder
				const appBagdeContainer = document.createElement('span');
				appBagdeContainer.classList.add('seventv-badge-list');
				badgeContainer?.insertAdjacentElement('afterend', appBagdeContainer);

				if (!!badgeContainer) {
					appBagdeContainer.appendChild(badge.toElement());
				}

				return undefined;
			})();
		}

		container.appendChild(newContext);
	}

	renderMessageTree(): HTMLElement[] {
		const tree = new MessageTree(this);

		return this.parts = tree.fill();
	}
}
