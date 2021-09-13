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
				for (const n of m.addedNodes) {
					this.handleNewChatMessage(n as YouTube.MessageElement);
				}
			}
		});

		observer.observe(items, { childList: true });
		for (const n of items.children) {
			this.handleNewChatMessage(n as YouTube.MessageElement);
		}
	}

	handleNewChatMessage(el: YouTube.MessageElement): void {
		el.classList.add('with-seventv', 'seventv-yt');
		const tok = new Tokenizer(this.page, el);
		if (tok.validate()) {
			const newBody = tok.generateTree();
			tok.contentMessage?.replaceWith(newBody);
		}
	}
}
