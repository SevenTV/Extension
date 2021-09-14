

export class YouTube {
	getChatContainer(): HTMLDivElement | null {
		return document.querySelector<HTMLDivElement>(YouTube.Selectors.ChatContainer) ?? null;
	}

	getChatItemsContainer(): YouTube.MessageElement | null {
		const frameWindow = (window.frames as any)['chatframe'].contentWindow as Window;
		const el = (frameWindow?.document ?? this.getChatContainer())?.querySelector<YouTube.MessageElement>(YouTube.Selectors.ChatItems);

		return el ?? null;
	}
}

export namespace YouTube {
	export namespace Selectors {
		export const ChatContainer = 'yt-live-chat-item-list-renderer';
		export const ChatItems = 'div#items.yt-live-chat-item-list-renderer';
	}

	export interface MessageElement extends HTMLDivElement {
		__data: MessageData;
	}

	/** YouTube Message Data */
	export interface MessageData {
		id: string;
		data: {
			authorName: {
				simpleText: string;
			};
			authorPhoto: {
				thumbnails: {
					[key: number]: { url: string; }
				}
			};
			inlineActionButtons: {
				buttonRenderer: {
					accessibility: { label: string };
					icon: { iconType: string; };
					isDisabled: boolean;
					size: string;
					style: string;
					tooltip: string;
					trackingParams: string;
				}
			}[];

			seventv: AppToken[];
			message: {
				runs: {
					text?: string;
					emoji?: Emoji;
				}[];
			};
			timestampUsec: string;
		};
		hasInlineActionButtons: number;
		hasOriginalContent: boolean;
		isDeleted: boolean;
		isDimmed: boolean;
		menuButton: HTMLDivElement;
		menuFocused: HTMLDivElement;
		menuVisible: boolean;
		popupPositionTarget: HTMLDivElement;
		showBar: boolean;
		showOriginal: boolean;
		timestampString: string;
	}

	export interface Emoji {
		emojiId: string;
		image: {
			thumbnails: {
				url: string;
				width: number;
				height: number;
			}[];
		};
		isCustomEmoji: boolean;
		searchTerms?: string[];
		shortcuts?: string[];
	}

	export interface AppToken {
		text: string;
		emoteID?: string;
	}
}
