/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module YouTube {
	export interface LiveChatItemListRenderer extends HTMLElement {
		__data: {
			visibleItems: LiveChatItem[];
		};
		handleAddChatItemAction_: (v: LiveChatItem) => any;
	}

	export interface LiveChatMessageInputRenderer extends Element {
		data: {
			sendButton: {
				buttonRenderer: {
					serviceEndpoint: {
						sendLiveChatMessageEndpoint: {
							params: string;
						};
					};
				};
			};
		};
	}

	export interface LiveChatItem {
		clientId?: string;
		clientMessageId?: string;
		item: {
			liveChatTextMessageRenderer: LiveChatMessage;
		};
	}

	export interface LiveChatMessage {
		authorExternalChannelId: string;
		authorName: LiveChatMessageSimpleTextToken;
		authorPhoto: unknown;
		id: string;
		message: {
			runs: AnyLiveChatMessageToken[];
		};
		timestampUsec: string;
		trackingParams: string;
	}

	export type AnyLiveChatMessageToken = Either<LiveChatMessageTextToken, LiveChatMessageEmojiToken>;

	export interface LiveChatMessageTextToken {
		text: string;
	}

	export interface LiveChatMessageSimpleTextToken {
		simpleText: string;
	}

	export interface LiveChatMessageEmojiToken {
		emoji: Emoji;
	}

	export interface Emoji {
		emojiId: string;
		image: EmojiImage;
		isCustomEmoji: boolean;
	}

	export interface EmojiImage {
		accessibility: {
			accessibilityData: {
				label: string;
			};
		};
		thumbnails: {
			url: string;
			width?: number;
			height?: number;
		}[];
	}

	export interface LiveChatTextInputFieldRenderer extends HTMLElement {
		getSuggestions: (s: string) => ChatSuggestion[];
	}

	export interface ChatSuggestion {
		alt: string;
		emoji: boolean;
		image: EmojiImage;
		text: string;
		textToInsertWhenSelected: string;
	}
}
