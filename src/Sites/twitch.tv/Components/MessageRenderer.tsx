import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';
import twemoji from 'twemoji';
import { SiteApp } from 'src/Sites/app/SiteApp';
import { MessageTree } from 'src/Sites/twitch.tv/Components/MessageTree';

export class MessageRenderer {
	private parts = [] as HTMLElement[];
	element: HTMLElement | null = null;

	constructor(
		public app: SiteApp,
		public msg: Twitch.ChatMessage,
		public elementId: string
	) {
		this.element = document.getElementById(elementId);
	}

	getChatContainer() {
		return document.querySelector(Twitch.Selectors.ChatScrollableContainer);
	}

	insert(): void {
		const el = this.element;
		if (!el) return undefined;

		// Delete previous message context if it exists
		const currentContext = el.querySelectorAll('.seventv-message-context');
		currentContext.forEach(c => {
			c.remove();
		});

		const container = el.querySelector('.chat-line__no-background') ?? el.querySelector(Twitch.Selectors.ChatMessageContainer) ?? el;
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
					const emoteji = this.app.emoteStore.fromEmoji(emoji);
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
				const usernameContainer = container.querySelector(Twitch.Selectors.ChatUsernameContainer); // Chat Line - Username Container
				const badgeList = this.app.badgeMap.get(parseInt(authorID)); // Get the badge index ID for this user
				if (!Array.isArray(badgeList) || badgeList.length === 0) {
					return undefined;
				}
				// Clear existing badge list
				const badgeListEl = usernameContainer?.querySelectorAll('.seventv-badge-list');
				badgeListEl?.forEach(x => x.remove());

				// Append to DOM
				const badgeContainer = usernameContainer?.children[0]; // Twitch Badge Container

				// Create an application context where 7TV badges will rneder
				const appBagdeContainer = document.createElement('span');
				appBagdeContainer.classList.add('seventv-badge-list');
				badgeContainer?.insertAdjacentElement('afterend', appBagdeContainer);

				for (const badgeID of badgeList) {
					const badge = this.app.badges[badgeID];
					if (badge === undefined) {
						continue;
					}

					if (!!badgeContainer) {
						appBagdeContainer.appendChild(badge.toElement());
					}

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
