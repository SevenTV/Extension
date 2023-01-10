/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
declare module Twitch {
	export type ChatLineComponent = ReactExtended.WritableComponent<{
		badgeSets: BadgeSets;
		channelID: string;
		channelLogin: string;
		confirmModerationAction: Function;
		currentUserDisplayName: string;
		currentUserID: string;
		currentUserLogin: string;
		deletedCount: number | undefined;
		deletedMessageDisplay: string;
		hasReply: string | undefined;
		hideBroadcasterTooltip: boolean | undefined;
		hideViewerCard: Function;
		isCurrentUserModerator: boolean;
		isCurrentUserStaff: boolean;
		isDeleted: boolean;
		isHidden: boolean;
		isHistorical: boolean | undefined;
		message: ChatMessage;
		onHiddenMessageClick: Function;
		onUsernameClick: Function;
		repliesAppearencePreference: string;
		reply: string | undefined;
		setTray: Function;
		setViewerCardPage: Function;
		showModerationIcons: boolean;
		showTimestamps: boolean;
		theme: number;
		tooltipLayer: {
			show: Function;
			showRich: Function;
			hide: Function;
		};
		useHighContrastColors: boolean;
	}> & {
		openViewerCard: (e: any) => void;
	};

	export type EmoteButton = ReactExtended.WritableComponent<{}> & {
		props: {
			onEmoteClick: (emote: {
				emoteID: string;
				emoteCode: string;
				sourceID: "chat";
				initialTopOffset: number;
				initialBottomOffset: number;
			}) => void;
		};
	};

	export type VideoMessageComponent = ReactExtended.WritableComponent<{
		badgeSets: BadgeSets;
		context: VideoChatCommentContext;
		currentUser: { id: string };
		isCurrentUserModerator: boolean;
		isExpandedLayout: boolean;
	}>;

	export type RouterComponent = ReactExtended.WritableComponent<{
		// React history object used for navigating.
		history: {
			action: string;
			goBack: () => void;
			goForward: () => void;
			listen: (handler: (location: Location, action: string) => void) => void;
			location: Location;
		};
		location: Location;
		isLoggedIn: boolean;
		match: {
			isExact: boolean;
			params: { [key: string]: string };
			path: string;
			url: string;
		};
	}>;

	export type SessionUserComponent = ReactExtended.WritableComponent<{
		sessionUser: {
			authToken: string;
			displayName: string;
			id: string;
			login: string;
		};
	}>;

	export type UserComponent = ReactExtended.WritableComponent<{
		user: {
			id: string;
			login: string;
			displayName: string;
			authToken?: string;
		};
	}>;

	export type ChatServiceComponent = ReactExtended.WritableComponent<{
		authToken: string;
		currentUserLogin: string;
		channelLogin: string;
		channelID: string;
	}> & {
		client: {
			connection: {
				ws: WebSocket;
			};
		};
		service: {
			client: {
				events: {
					joined: (fn: (x: { channel: string; gotUsername: boolean; username: string }) => void) => void;
				};
			};
		};
	};

	export type ChatControllerComponent = ReactExtended.WritableComponent<{
		authToken: string | undefined;
		channelDisplayName: string;
		channelID: string;
		channelLogin: string;
		chatConnectionAPI: {
			sendMessage: (m: string) => void;
		};
		chatRules: string[];
		emoteSetsData?: {
			loading: boolean;
			emoteMap: Record<string, TwitchEmote>;
			emoteSets: TwitchEmoteSet[];
		};
		clientID: string;
		firstPageLoaded: boolean;
		followerModeDuration: number;
		initialStateLoaded: boolean;
		inlineRightColumnExpanded: boolean;
		isBackground: boolean | undefined;
		isChatRulesOpen: boolean;
		isCurrentUserEditor: boolean;
		isCurrentUserModerator: boolean;
		isCurrentUserVIP: boolean;
		isEmbedded: boolean;
		isHidden: boolean;
		isInspecting: boolean;
		isLoggedIn: boolean;
		isPopout: boolean;
		isReadOnly: boolean | undefined;
		isStaff: boolean;
		messageHandlerAPI: MessageHandlerAPI;
		rightColumnExpanded: boolean;
		rootTrackerExists: boolean;
		shouldConnectChat: boolean | undefined;
		shouldSeeBlockedAndDeleteMessages: boolean;
		slowModeDuration: number;
		slowModeEnabled: boolean;
		theme: number;
		userDisplayName: string | undefined;
		userID: string | undefined;
		userLogin: string | undefined;
	}> & {
		pushMessage: (msg: Partial<ChatMessage>) => void;
		sendMessage: (msg: string, n?: any) => void;
		onRoomStateUpdated: (e: any) => void;
		onChatEvent: (e: any) => void;
		onBadgesUpdated: (e: any) => void;
	};

	export type ChatListComponent = ReactExtended.WritableComponent<{
		channelID: string;
		children: ReactExtended.ReactRuntimeElement[];
		currentUserLogin: string;
		hasNewerLeft: boolean;
		messageHandlerAPI: MessageHandlerAPI;
	}>;

	export type ChatRoomComponent = ReactExtended.WritableComponent<{
		primaryColorHex: string;
		useHighContrastColors: boolean;
		showTimestamps: boolean;
	}>;

	export interface MessageHandlerAPI {
		addMessageHandler: (event: (msg: ChatMessage) => void) => void;
		removeMessageHandler: (event: (msg: ChatMessage) => void) => void;
		handleMessage: (msg: ChatMessage) => void;
	}

	export type VideoChannelComponent = ReactExtended.WritableComponent<{
		channelID: string;
		displayName: string;
		channelLogin: string;
	}>;

	export type ChatScrollerComponent = ReactExtended.WritableComponent<{}> & {
		onScroll: (e: Event) => void;
	};

	export type ChatComponent = ReactExtended.WritableComponent<
		{
			authToken: string;
			bitsConfig: BitsConfig;
			bitsEnabled: boolean;
			channelDisplayName: string;
			channelID: string;
			channelLogin: string;
			chatRoomHeader: any;
			chatRules: string[];
			chatView: number;
			emotes: TwitchEmoteSet[];
			location: {
				hash: string;
				pathname: string;
				search: string;
				state: any;
			};
			userBadges: { [key: string]: "1" | "0" };
			userID: string;
		},
		{
			badgeSets: BadgeSets;
			chatListElement: HTMLDivElement;
		}
	>;

	export type VideoChatComponent = ReactExtended.WritableComponent<{
		bitsConfig: BitsConfig;
		blockedUsers: {
			[key: string]: boolean;
		};
		comments: VideoChatCommentContext[];
		currentVideoTime: number;
		onBanUser: (n: any) => void;
		onCreate: (n: any) => void;
		onDeleteComment: (n: any) => void;
		videoID: string;
	}>;

	export type ChatInputController = ReactExtended.WritableComponent<{
		sendMessageErrorChecks: Record<
			"duplicated-messages" | "message-throughput",
			{
				check: (value: string) => any;
				onMessageSent: (x: any) => any;
			}
		>;
		chatConnectionAPI: {
			sendMessage: Function;
		};
		onSendMessage: (
			value: string,
			reply: {
				parentDeleted: boolean;
				parentDisplayName: string;
				parentMessageBodsy: string;
				parentMsgId: string;
				parentUid: string;
				parentUserLogin: string;
			},
		) => any;
		showEmotePicker: (v: any) => void;
	}> & {
		autocompleteInputRef: ChatAutocompleteComponent;
		chatInputRef: ChatInputComponent;
		onEmotePickerButtonClick: () => void;
		onEmotePickerToggle: () => void;
	};

	export type ChatInputComponent = ReactExtended.WritableComponent<
		{
			channelID: string;
			channelLogin: string;
			setInputValue: (v: string) => void;
			onFocus: (v: any) => void;
			onChange: (v: any) => void;
			onKeyDown: (v: any) => void;
			onValueUpdate: (v: any) => void;
			value: string;
			placeholder: string;
			paddingLeft: number;
			paddingRight: number;
		},
		{
			slateEditor?: ChatSlate;
		}
	> & {
		selectionStart: number;
		focus: () => void;
	};

	export type ChatAutocompleteComponent = ReactExtended.WritableComponent<
		{
			channelID: string;
			channelLogin: string;
			clearModifierTray: () => void;
			clearReplyToList: () => void;
			closeCard: () => void;
			closeKeyboardReplyTray: () => void;
			currentUserDisplayName: string;
			currentUserID: string;
			currentUserLogin: string;
			emotes: TwitchEmoteSet[];
			isCurrentUserEditor: boolean;
			isCurrentUserModerator: boolean;
			isCurrentUserStaff: boolean;
			messageBufferAPI: any;
			onFocus: (v: any) => any;
			onKeyDown: (v: any) => any;
			onMatch: (e: any, t: any, i: any) => any;
			onReset: (v: any) => any;
			onValueUpdate: (v: any) => any;
			setInputValue: (v: any) => any;
			setModifierTray: (v: any) => any;
			setReplyToList: (v: any) => any;
			setTray: (v: any) => any;
			showModerationIcons: boolean;
			showTimestamps: boolean;
			tray: any;
			useHighContrastColors: boolean;
		},
		{
			value: string;
		}
	> & {
		focus: () => void;
		selectionStart: number;
		setSelectionRange: (start: number, end: number) => void;
		componentRef: Twitch.ChatInputComponent;
		getMatches: (v: string) => object[];
		providers: ChatAutocompleteProvider[];
		onEditableValueUpdate: (value: string, sendOnUpdate: boolean | undefined) => void;
		getValue: () => string;
		setValue: (v: string) => void;
	};

	export type ChatSlate = {
		children: ChatStateLeaf[];
		selection: {
			anchor: {
				offset: number;
				path: number[];
			};
			focus: {
				offset: number;
				path: number[];
			};
		} | null;
		isInline: (element: ChatSlateLeaf) => boolean;
		isVoid: (element: ChatSlateLeaf) => boolean;
		normalizeNode: (entry: ChatSlateLeaf) => void;
		onChange: () => void;
		addMark: (key: string, value: any) => void;
		apply: (operation: object) => void;
		deleteBackward: (unit: "character" | "word" | "line" | "block") => void;
		deleteForward: (unit: "character" | "word" | "line" | "block") => void;
		deleteFragment: () => void;
		insertBreak: () => void;
		insertFragment: (fragment: ChatSlateLeaf[]) => void;
		insertNode: (node: ChatSlateLeaf) => void;
		insertText: (text: string) => void;
		removeMark: (key: string) => void;
	};

	export type ChatSlateLeaf = {
		type: "text" | "paragraph" | "emote";
		children: ChatStateLeaf[];
		emoteData?: {};
		emoteName?: string;
		text?: string;
	};

	export type ChatAutocompleteProvider = {
		autocompleteType: string;
		canBeTriggeredByTab: boolean;
		getMatches: (
			string: string,
			unk: unknown,
			index: number,
		) =>
			| {
					current: string;
					element: React.ReactFragment;
					replacement: string;
					type: string;
			  }[]
			| undefined;
		props: {
			emotes: TwitchEmoteSet[];
			isEmoteAnimationsEnabled: boolean;
			registerAutocompleteProvider: (p: ChatAutocompleteProvider) => void;
			theme: Theme;
		};
	};

	export enum Theme {
		"Light",
		"Dark",
	}

	// Standard React location object.
	export interface Location {
		hash: string;
		key: string;
		pathname: string;
		search: string;
		state?: {
			content: string;
			medium: string;
			freeform_tag_filter?: string;
			previous_search_query_id?: string;
			search_query_id?: string;
			search_session_id?: string;
		};
	}

	export interface BitsConfig {
		getImage: (n: any, i: any, a: any, r: any, s: any) => any;
		indexedActions: {
			[key: string]: {
				id: string;
				prefix: string;
				type: string;
				campaign: string | null;
				tiers: {
					id: string;
					bits: number;
					canShowInBitsCard: boolean;
					__typename: string;
				};
				template: string;
				__typename: string;
			};
		};
	}

	export interface MessageCardOpeners {
		onShowEmoteCard: (v: any) => void;
		onShowViewerCard: (v: any) => void;
		hideViewerCard: () => void;
		props: {
			onUsernameClick: (v: any) => void;
		};
	}

	export interface TwitchEmoteSet {
		id: string;
		emotes: TwitchEmote[];
		owner?: {
			displayName: string;
			id: string;
			login: string;
			profileImageURL: string;
		};
		__typename?: string;
	}

	export interface BadgeSets {
		channelsBySet: Map<string, Map<string, ChatBadge>>;
		count: number;
		globalsBySet: Map<string, Map<string, ChatBadge>>;
	}

	export interface ChatBadge {
		clickAction: string | null;
		clickURL: string | null;
		id: string;
		image1x: string;
		image2x: string;
		image4x: string;
		setID: string;
		title: string;
		version: string;
		__typename: string;
	}

	export interface VideoChatComment {
		channelId: string;
		commenter: string;
		contentId: string;
		contentOffset: number;
		contentType: string;
		createdAt: Date;
		id: string;
		message: {
			id: string;
			isAction: boolean;
			tokens: ChatMessage.Part[];
			userColor: string;
			userNoticeParams: {};
		};
		moreReplies: boolean;
		parentId: string;
		source: string;
		state: string;
		userBadges: {
			[key: string]: string;
		};
	}

	export interface VideoChatCommentContext {
		author: {
			bio: string;
			createdAt: Date;
			displayName: string;
			id: string;
			logo: URL;
			name: string;
			type: string;
			updatedAt: Date;
		};
		comment: VideoChatComment;
		lastUpdated: Date;
		replies: [];
	}

	export interface AnyMessage {
		id: string;
		type: number;

		seventv?: boolean;
		t?: number;
		element?: HTMLElement;
	}

	export interface DisplayableMessage extends AnyMessage {
		user: ChatUser;
		message?: ChatMessage;
		messageParts?: ChatMessage.Part[];
		badges?: Record<string, string>;
		deleted?: boolean;
		banned?: boolean;
	}

	export interface ChatMessage extends AnyMessage {
		user: ChatUser;
		badgeDynamicData: {};
		badges: Record<string, string>;
		banned: boolean;
		bits: number;
		deleted: boolean;
		hidden: boolean;
		isHistorical: unknown;
		message: string | ChatMessage;
		messageBody: string;
		messageParts: ChatMessage.Part[];
		messageType: number;
		emotes?: any;
		timestamp: number;
	}

	export interface SubMessage extends AnyMessage {
		user: ChatUser;
		channel: string;
		methods?: {
			plan: string;
			planName: string;
			prime: boolean;
		};
		message?: ChatMessage;
		months?: number;
		cumulativeMonths?: number;
		shouldShareStreakTenure: boolean;
		wasGift: boolean;
		recipientDisplayName?: string;
		giftMonths?: number;
		streakMonths?: number;
	}

	export namespace ChatMessage {
		export interface Part {
			content: string | EmoteRef | LinkContent | { [key: string]: any };
			type: number;
		}
		export namespace Part {
			export interface EmoteContent {
				alt: string;
				emoteID?: string;
				images?: {
					dark: {
						"1x": string;
						"2x": string;
						"3x": string;
						"4x": string;
					};
					light: {
						"1x": string;
						"2x": string;
						"3x": string;
						"4x": string;
					};
					themed: boolean;
				};

				// Only exists if cheermote
				cheerAmount?: number;
				cheerColor?: string;
			}

			export interface LinkContent {
				displayText: string;
				url: string;
			}
		}

		export interface AppPart {
			type: "text" | "emote" | "twitch-emote" | "link" | "mention";
			content?: string | { [key: string]: any };
		}
	}

	export interface ModerationMessage extends AnyMessage {
		duration: number;
		moderationType: number;
		reason: string;
		userLogin: string;
		targetMessageID?: string;
	}

	export interface ChannelPointsRewardMessage extends AnyMessage {
		displayName: string;
		login: string;
		message: ChatMessage;
		reward: {
			cost: number;
			isHighlighted: boolean;
			name: string;
		};
		userID: string;
	}

	export interface MassGiftMessage extends AnyMessage {
		user: ChatUser;
		channel: string;
		massGiftCount: number;
		plan: string;
		senderCount: number;
	}

	export interface RaidMessage extends AnyMessage {
		channel: string;
		userLogin: string;
		params: {
			displayName: string;
			login: string;
			msgId: string;
			userID: string;
			viewerCount: string;
		};
	}

	export interface AnnouncementMessage extends AnyMessage {
		color: "PRIMARY" | "BLUE" | "GREEN" | "ORANGE" | "PURPLE";
		message: ChatMessage;
	}

	export interface ChatUser {
		color: string;
		isIntl: boolean;
		isSubscriber: boolean;
		userDisplayName?: string;
		displayName?: string;
		userID: string;
		userLogin: string;
		userType: string;
	}

	export interface TwitchEmote {
		id: string;
		modifiers?: any;
		setID: string;
		displayName?: string;
		token: string;
		type: string;
		owner?: {
			displayName: string;
			id: string;
			login: string;
			profileImageURL: string;
		};
		__typename?: string;
		srcSet?: string;
	}
}
