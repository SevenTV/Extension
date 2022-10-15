/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
declare module Twitch {
	export type FindReactInstancePredicate = (node: any) => boolean;
	export type AnyPureComponent = React.PureComponent & { [x: string]: any };
	export interface TwitchPureComponent extends AnyPureComponent {
		child: TwitchPureComponent;
		alternate: TwitchPureComponent;
		childExpirationTime: number;
		dependencies: any;
		effectTag: number;
		elementType: string;
		expirationTime: number;
		firstEffect: any;
		index: number;
		key: any;
		lastEffect: any;
		memoizedProps: any;
		pendingProps: any;
		mode: number;
		nextEffect: any;
		ref: any;
		return: TwitchPureComponent | AnyPureComponent;
		tag: number;
		type: string;
		updateQueue: any;
	}

	export interface ChatLineAndComponent {
		element?: HTMLDivElement;
		inst: TwitchPureComponent;
		component: ChatLineComponent;
	}

	export interface VideoChatLineAndComponent {
		element?: HTMLDivElement;
		inst: TwitchPureComponent;
		component: VideoChatComponent;
	}

	export type ChatLineComponent = React.PureComponent<{
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

	export type EmoteButton = React.Component<{}> & {
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

	export type VideoMessageComponent = React.PureComponent<{
		badgeSets: BadgeSets;
		context: VideoChatCommentContext;
		currentUser: { id: string };
		isCurrentUserModerator: boolean;
		isExpandedLayout: boolean;
	}>;

	export type RouterComponent = React.PureComponent<{
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

	export type UserComponent = React.Component<{
		user: {
			id: string;
			login: string;
			displayName: string;
			authToken?: string;
		};
	}>;

	export type ChatServiceComponent = React.PureComponent<{
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

	export type ChatControllerComponent = React.PureComponent<{
		authToken: string | undefined;
		channelDisplayName: string;
		channelID: string;
		channelLogin: string;
		chatConnectionAPI: {
			sendMessage: Function;
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
		messageHandlerAPI: {
			addMessageHandler: (event: (msg: ChatMessage) => void) => void;
			removeMessageHandler: (event: (msg: ChatMessage) => void) => void;
			handleMessage: (msg: ChatMessage) => void;
		};
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

	export type VideoChannelComponent = React.PureComponent<{
		channelID: string;
		displayName: string;
		channelLogin: string;
	}>;

	export type ChatScrollerComponent = React.PureComponent<{}> & {
		onScroll: (e: Event) => void;
	};

	export type ChatComponent = React.PureComponent<
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

	export type VideoChatComponent = React.PureComponent<{
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

	export type ChatInputController = React.Component<{
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
	}> & {
		props: {
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
		};
	};

	export type ChatInputComponent = React.Component<{
		channelID: string;
		channelLogin: string;
		setInputValue: (v: string) => void;
		onFocus: (v: any) => void;
		onChange: (v: any) => void;
		onKeyDown: (v: any) => void;
		onValueUpdate: (v: any) => void;
		value: string;
	}> & { selectionStart: number };

	export type ChatAutocompleteComponent = {
		componentRef: Twitch.ChatInputComponent;
		getMatches: (v: string) => TwitchEmote[];
		props: {
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
		};
		providers: Provider[];
	};

	export type Provider = {
		autocompleteType: string;
		canBeTriggeredByTab: boolean;
		doesEmoteMatchTerm: (e: TwitchEmote, t: string) => boolean;
		getMatchedEmotes: (s: string) => TwitchEmote[];
		getMatches: (x: string) => any[];
		props: {
			emotes: TwitchEmoteSet[];
			isEmoteAnimationsEnabled: boolean;
			registerAutocompleteProvider: (p: Provider) => void;
			theme: Theme;
		};
		renderEmoteSuggestion: (e: TwitchEmote) => TwitchEmote;
		hydrateEmotes: (emotes: any, b: boolean, theme: Twitch.Theme) => Twitch.TwitchEmoteSet[];
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

	export interface ChatMessage {
		badgeDynamicData: {};
		badges: Record<string, string>;
		banned: boolean;
		bits: number;
		deleted: boolean;
		hidden: boolean;
		id: string;
		isHistorical: unknown;
		message: string | ChatMessage;
		messageBody: string;
		messageParts: ChatMessage.Part[];
		messageType: number;
		type: number;
		reply: unknown;
		user: ChatUser;
		state?: {
			broadcasterLanguage: string | null;
			emoteOnly: boolean;
			followersOnly: boolean;
			followersOnlyRequirement: number;
			r9k: boolean;
			mercury: boolean;
			slowMode: boolean;
			slowModeDuration: number;
			subsOnly: boolean;
		};
		emotes?: any;

		seventv?: boolean;
		t?: number;
		element?: HTMLElement;
	}
	export namespace ChatMessage {
		export interface Part {
			content: string | EmoteRef | { [key: string]: any };
			type: number;
		}

		export interface EmoteRef {
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

		export interface AppPart {
			type: "text" | "emote" | "twitch-emote" | "link" | "mention";
			content?: string | { [key: string]: any };
		}

		export interface ModerationMessage {
			duration: number;
			id: string;
			moderationType: number;
			reason: string;
			type: number;
			userLogin: string;
		}
	}

	export interface ChatUser {
		color: string;
		isIntl: boolean;
		isSubscriber: boolean;
		userDisplayName: string;
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
		_thirdPartyGlobal: boolean;
		srcSet?: string;
	}
}
