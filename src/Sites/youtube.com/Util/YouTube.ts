

export class YouTube {
	getChatContainer(): HTMLDivElement | null {
		return document.querySelector<HTMLDivElement>(YouTube.Selectors.ChatContainer) ?? null;
	}

	getChatItemsContainer(): HTMLDivElement | null {
		const el = this.getChatContainer()?.querySelector<HTMLDivElement>(YouTube.Selectors.ChatItems);

		return el ?? null;
	}
}

export namespace YouTube {
	export namespace Selectors {
		export const ChatContainer = 'yt-live-chat-item-list-renderer';
		export const ChatItems = 'div#items';
	}
}
