

export class YouTube {
	getChatContainer(): HTMLDivElement | null {
		return (this.getChatFrame() ?? document).querySelector<HTMLDivElement>(YouTube.Selectors.ChatContainer) ?? null;
	}

	getChatItemsContainer(): YouTube.MessageElement | null {
		const frame = this.getChatFrame();
		const el = (frame ?? this.getChatContainer())?.querySelector<YouTube.MessageElement>(YouTube.Selectors.ChatItems);

		return el ?? null;
	}

	getChatFrame(): Document | null {
		return (window.frames as any)['chatframe']?.contentDocument as Document ?? null;
	}

	getChatInput(frame?: Document): YouTube.InputElement | null {
		return (frame ?? document).querySelector<YouTube.InputElement>('yt-live-chat-text-input-field-renderer#input.yt-live-chat-message-input-renderer');
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

	export interface InputElement extends HTMLDivElement {
		__data: InputData;
		liveChatRichMessageInput: InputData['liveChatRichMessageInput'];
		onInputChange_: () => void;
	}

	/** YouTube Message Data */
	export interface MessageData {
		id: string;
		authorBadges: {
			liveChatAuthorBadgeRenderer: {
				icon: {
					iconType: string;
				}
			}
		}[];
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
					navigationEndpoint?: NavigationEndpoint
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

	export interface NavigationEndpoint {
		urlEndpoint: {
			url: string;
		};
	}

	export interface AppToken {
		text: string;
		emoteID?: string;
	}

	export interface InputData {
		characterCount: number;
		data: {
			emojiCharacterCount: number;
			maxCharacterLimit: number;
		};
		disabled: boolean;
		focused: boolean;
		hasText: boolean;
		inputTabIndex: number;
		isInputValid: boolean;
		isValidWithNoInputText: boolean;
		liveChatRichMessageInput: {
			textSegments: { text: string; }[];
		};
		maxCharacterLimit: number;
		suggestions: {
			alt: string;
			emoji: boolean;
			image: {
				thumbnails: Thumbnail[];
			}
		}[];
	}

	export interface Thumbnail {
		url: string;
		width?: number;
		height?: number;
	}

	export interface VideoDetails {
		allowRatings: boolean;
		author: string;
		averageRating: number;
		channelId: string;
		isCrawlable: boolean;
		isLive: boolean;
		isLiveContent: boolean;
		isLiveDvrEnabled: boolean;
		isLowLatencyLiveStream: boolean;
		isOwnerViewing: boolean;
		isPrivate: boolean;
		isUnpluggedCorpus: boolean;
		keywords: string[];
		latencyClass: string;
		shortDescription: string;
		thumbnail: { thumbnails: Thumbnail[] };
		title: string;
		videoId: string;
		viewCount: string;

	}
}
