import { Logger } from 'src/Logger';
import { MessagePatcher } from 'src/Sites/twitch.tv/Util/MessagePatcher';
import { Tokenizer } from 'src/Sites/youtube.com/Runtime/Tokenizer';
import { YouTube } from 'src/Sites/youtube.com/Util/YouTube';
import { YouTubePageScript } from 'src/Sites/youtube.com/youtube';

export class ChatObserver {
	regex = MessagePatcher.getRegexp();

	constructor(private page: YouTubePageScript) {

	}

	listen(): void {
		const items = this.page.youtube.getChatItemsContainer();
		if (!items) {
			Logger.Get().warn('ChatItems Not Found');
			return undefined;
		}

		const observer = new MutationObserver(mutations => {
			for (const m of mutations) {
				// Render new messages
				for (const n of m.addedNodes) {
					this.handleNewChatMessage(n as YouTube.MessageElement);
				}
			}
		});

		observer.observe(items, { childList: true, attributes: true });

		const container = this.page.youtube.getChatContainer();
		container?.setAttribute('seventv-loaded', '');
		const rerenderObserver = new MutationObserver(mutations => {
			for (const m of mutations) {
				// If target lost the seventv-loaded attr, this means we should restart
				if (m.oldValue === 'yt-live-chat-renderer') {
					observer.disconnect();
					rerenderObserver.disconnect();
					this.listen();
					this.rerenderAll();
					this.page.insertEmoteMenuButton();
				}
			}
		});
		rerenderObserver.observe(container as Node, { attributes: true, attributeOldValue: true, childList: true });
	}

	rerenderAll(): void {
		const items = this.page.youtube.getChatItemsContainer();
		if (!items) {
			Logger.Get().warn('ChatItems Not Found');
			return undefined;
		}

		for (const n of items.children) {
			this.handleNewChatMessage(n as YouTube.MessageElement);
		}
	}

	handleNewChatMessage(el: YouTube.MessageElement): void {

		el.classList.add('seventv-yt');

		const tok = new Tokenizer(this.page, el);
		if (tok.validate()) {
			const newBody = tok.generateTree();
			tok.contentMessage?.replaceWith(newBody);

			if ( this.page.site.config.get('yt.random_color')?.asBoolean()) {
				const name = tok.content?.querySelector<HTMLDivElement>('span#author-name');

				if ( name ) {
					name.style.color = this.stringToColour(name.innerText) + 'C0';
					name.style.textShadow = '0 0 var(--yt-live-chat-secondary-text-color)';
				}
			}

			if ( this.page.site.config.get('yt.hide_picture')?.asBoolean() ) {
				el.querySelector<HTMLDivElement>('yt-img-shadow#author-photo')?.remove();
			}
		}
	}

	stringToColour(str : string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}

		let colour = '#';
		for (let i = 0; i < 3; i++) {
			let value = ((hash >> (i * 8)) & 0xFF);
			colour += ('00' + value.toString(16)).substr(-2);
		}

		return colour;
	}
}
