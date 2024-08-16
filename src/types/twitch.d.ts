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

	export type UserAndSessionUserComponent = SessionUserComponent & UserComponent;

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

	export enum WarnUserPopoverPlacement {
		CHAT = 0,
		VIEWERS_LIST = 1,
	}

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
		warnUserTargetLogin: string | undefined;
		warnUserTargetID: string | undefined;
		setWarnUserTarget: (target: { targetUserLogin: string; targetUserID: string }) => void;
		setWarnUserPopoverPlacement: (placement: WarnUserPopoverPlacement | null) => void;
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
		primaryColorHex: string | null;
		useHighContrastColors: boolean;
		showTimestamps: boolean;
		showAutomodActions: boolean;
		showModerationActions: boolean;
		showModerationIcons: boolean;
		isWatchPartyActive: boolean;
		isShowingCommunityHighlightList: boolean;
		deletedMessageDisplay: "BRIEF" | "DETAILED" | "LEGACY";
		chatPauseSetting: "MOUSEOVER" | "SCROLL_ONLY" | "ALTKEY" | "MOUSEOVER_ALTKEY";
		badgeSets: BadgeSets;
	}>;

	export type ViewerCardComponent = ReactExtended.WritableComponent<{}> & {
		onShowViewerCard: (
			userLogin: string,
			type: number,
			messageID: string,
			initialTopOffset: number,
			initialLeftOffset?: number,
		) => void;
		onShowEmoteCard: (emote: {
			emoteID: string;
			emoteCode: string;
			sourceID: "chat";
			initialTopOffset: number;
			initialBottomOffset: number;
		}) => void;
		setViewerCardPage: (v: any) => void;
	};

	export type MessageBufferComponent = ReactExtended.WritableComponent<{
		isLoadingHistoricalMessages: boolean;
	}> & {
		buffer: DisplayableMessage[];
		blockedUsers: Set<string>;
	};

	export type ChatEventComponent = ReactExtended.WritableComponent<{}> & {
		onClearChatEvent: (e: { channel: string }) => void;
	};

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
		canCurrentUserBan: boolean;
		canCurrentUserDelete: boolean;
		videoID: string;
		data: {
			badges: ChatBadge[];
			video: {
				id: string;
				login: string;
				lengthSeconds: number;
				owner: {
					id: string;
					login: string;
					broadcastBadges: ChatBadge[];
				};
			} | null;
		};
	}>;

	export type ChatInputController = ReactExtended.WritableComponent<{
		channelID: string;
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
		clearMenus: () => void;
		closeEmotePicker: () => void;
		activeTray?: ChatTray;
	}> & {
		autocompleteInputRef: ChatAutocompleteComponent;
		chatInputRef: ChatInputComponent;
		onEmotePickerButtonClick: () => void;
		onEmotePickerToggle: () => void;
		closeBitsCard: () => void;
		closePaidPinnedChatCardForEmotePicker: () => void;
		closeCheerCard: () => void;
		onBitsIconClick: () => void;
		getSendMessagePlaceholder: () => string;
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
			emotes: TwitchEmoteSet[];
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
			clearTray: () => void;
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
			setTray: (v?: ChatTray) => any;
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
		getMatches: (v: string, ...args: []) => object[];
		providers: ChatAutocompleteProvider[];
		onEditableValueUpdate: (value: string, sendOnUpdate: boolean | undefined) => void;
		getValue: () => string;
		setValue: (v: string) => void;
	};

	export interface ChatCommand {
		name: string;
		description: string;
		helpText: string; // Gets called by /help
		permissionLevel: 0 | 1 | 2 | 3; // Anyone, vip, mod, broadcaster (editor if allowEditorUsage is true)
		handler?: ChatCommand.Handler;
		commandArgs?: {
			name: string;
			isRequired: boolean;
		}[];
		hidden?: boolean; // Makes the command not appear in the preview, but will still be callable.
		allowEditorUsage?: boolean;
		group?: string;
	}
	export namespace ChatCommand {
		export interface AsyncResult {
			notice?: string;
			error?: Error;
			inputValue?: string;
		}
		export type Result = void | {
			deferred?: Promise<AsyncResult>;
			preserveInput?: boolean;
		};
		export interface Handler {
			(args: string, context: { channelLogin: string }): Result;
		}
		export type Error = "unrecognized_cmd" | "missing_parameters" | "unauthorized" | "pin_failure" | string;
	}

	export type ChatCommandComponent = ReactExtended.WritableComponent<{}> & {
		addCommand: (c: ChatCommand) => void;
		removeCommand: (c: ChatCommand) => void;
	};
	export type ChatCommandGrouperComponent = ReactExtended.WritableComponent<{}> & {
		determineGroup: (command: ChatCommand) => string;
	};

	export type ChatCommunityPointsButtonComponent = ReactExtended.WritableComponent<{}> & {
		shouldShowBitsBalance: () => boolean;
	};

	export type ChatChannelPointsClaimComponent = ReactExtended.WritableComponent<{
		hidden: boolean;
	}> & {
		onClick: () => void;
		claimErrorTimer: number;
	};

	export type ChatInputControllerComponent = ReactExtended.WritableComponent<{}> & {
		container: HTMLDivElement;
	};

	export interface UserAvatar extends ReactExtended.ReactRuntimeElement {
		props: {
			alt: string;
			borderRadius: string;
			"data-a-target": string;
			size: number;
			src: string;
			userLogin: string;
		};
	}

	export interface ChatTray<
		T extends keyof ChatTray.Type = "SevenTVCustomTray",
		H extends keyof ChatTray.SendMessageHandler.Type = "Custom",
	> {
		type: ChatTray.Type[T];
		header?: ReactExtended.ReactRuntimeElement | Component;
		body?: ReactExtended.ReactRuntimeElement | Component;
		inputValueOverride?: string;
		sendButtonOverride?: string;
		disableCommands?: boolean;
		disableBits?: boolean;
		disablePaidPinnedChat?: boolean;
		onClose?: (v?: any) => any;
		disableChat?: boolean;
		sendMessageHandler?: ChatTray.SendMessageHandler<H>;
		messageHandler?: (v: string) => void;
		placeholder?: string;
		floating?: boolean;
	}

	export namespace ChatTray {
		export interface Type {
			AliasBannedFromChannelBanner: "alias-banned-from-channel-banner";
			AliasBannedFromChannelWarning: "alias-banned-from-channel-warning";
			AutocompleteTray: "autocomplete-tray";
			CharacterLimitError: "character-limit-error";
			CharacterLimitWarning: "character-limit-warning";
			CheerCard: "cheer-card";
			CommandInfo: "command-info";
			CommandWarning: "command-warning";
			CommunityMomentClaimError: "community-moment-claim-error";
			Connecting: "connecting";
			CreatorAnniversariesCallout: "creator-anniversaries-callout";
			CustomReward: "custom-reward";
			CustomViewerIntroduction: "custom-viewer-introduction";
			DropsClaim: "drops-claim";
			DropsError: "drops-error";
			DuplicatedMessageError: "duplicated-message-error";
			EmoteOnlyBanner: "emote-only-banner";
			EmoteOnlyInfo: "emote-only-info";
			EmoteOnlyWarning: "emote-only-warning";
			FollowerModeBanner: "follower-mode-banner";
			FollowerModeInfo: "follower-mode-info";
			FollowerModeWarning: "follower-mode-warning";
			GenericPrivateCallout: "generic-private-callout";
			HighlightedMessage: "highlighted-message";
			HypeTrainRewards: "hype-train-rewards";
			MegaRewardsRecipient: "mega-rewards-recipient";
			MessageThroughputError: "message-throughput-error";
			MobilePhoneVerificationBanner: "mobile-phone-verification-banner";
			MobilePhoneVerificationInfo: "mobile-phone-verification-info";
			MobilePhoneVerificationSuccess: "mobile-phone-verification-success";
			MobilePhoneVerificationWarning: "mobile-phone-verification-warning";
			MobilePhoneVerificationWarningMessageFail: "mobile-phone-verification-warning-message-fail";
			PaidPinnedChatCard: "paid-pinned-chat-card";
			Reply: "reply";
			ShareBitsBadgeTier: "share-bits-badge-tier";
			ShareEmote: "share-emote";
			ShareResub: "share-resub";
			ShieldModeActiveBanner: "shield-mode-active-banner";
			ShieldModeActiveInfo: "shield-mode-active-info";
			SlowModeBanner: "slow-mode-banner";
			SlowModeInfo: "slow-mode-info";
			SubsOnlyBanner: "subs-only-banner";
			SubsOnlyInfo: "subs-only-info";
			SubsOnlyMessage: "subs-only-message";
			SubsOnlyWarning: "subs-only-warning";
			ThankSubGifter: "thank-sub-gifter";
			VerifiedOnlyModeBanner: "verified-only-mode-banner";
			VerifiedOnlyModeInfo: "verified-only-mode-info";
			VerifiedOnlyModeWarning: "verified-only-mode-warning";
			ViewerIntroduction: "viewer-introduction";

			SevenTVCustomTray: "seventv-custom-tray";
		}

		export interface SendMessageHandler<T extends keyof SendMessageHandler.Type = "Custom"> {
			type: SendMessageHandler.Type[T];
			handleMessage?: (msg: string) => void;
			additionalMetadata?: Partial<DisplayableMessage>;
		}

		export namespace SendMessageHandler {
			export type Type = {
				BuyAndCheer: "buy-and-cheer";
				BuyBitsCheckout: "buy-bits-checkout";
				BuyPaidPinnedMessage: "buy-paid-pinned-message";
				CommunityPointsSpend: "community-points-spend";
				NoOverride: "no-override";
				Reply: "reply";
				ShareBitsBadgeTier: "share-bits-badge-tier";
				ShareDrop: "share-drop";
				ShareEmoteReward: "share-emote-reward";
				ShareResub: "share-resub";
				ThankSubGifter: "thank-sub-gifter";
				Custom: "custom-message-handler";
			};
		}
	}

	export type TrayProps<T extends keyof Twitch.ChatTray.Type> = {
		Reply: {
			id: string;
			authorID?: string;
			body: string;
			deleted: boolean;
			username?: string;
			displayName?: string;
			thread?: {
				deleted: boolean;
				id: string;
				login: string;
			};
		};
	}[T] & {
		close?: () => void;
	};

	export type CustomTrayOptions<
		T extends keyof ChatTray.Type = "SevenTVCustomTray",
		H extends keyof ChatTray.SendMessageHandler.Type = "Custom",
	> = Omit<ChatTray<T, H>, "type" | "body" | "header">;

	export type ComponentProps<C extends Component> = C extends new (...args: any) => any
		? Omit<InstanceType<C>["$props"], keyof VNodeProps | keyof AllowedComponentProps>
		: never;

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

	export type ChatAutocompleteProvider<T extends "emote" | "mention" | "command" | string = unknown> = {
		autocompleteType: T;
		canBeTriggeredByTab: boolean;
		getMatches: (
			string: string,
			unk: unknown,
			index: number,
			...args: unknown[]
		) =>
			| {
					current: string;
					element: React.ReactFragment;
					replacement: string;
					type: string;
			  }[]
			| undefined;
		props: {
			registerAutocompleteProvider: (p: ChatAutocompleteProvider) => void;
		} & {
			emote: {
				emotes: TwitchEmoteSet[];
				isEmoteAnimationsEnabled: boolean;
				theme: Theme;
			};
			mention: {
				activeChattersAPI: {
					getActiveChatterLoginFromDisplayName: () => void;
					getActiveChatters: () => void;
					handleMessage: (m: AnyMessage) => void;
				};
				showReplyPrompt: boolean;
				channelID: string;
				currentUserLogin: string;
			};
			command: {
				getCommands: () => any[];
				isCurrentUserEditor: boolean;
				permissionLevel: number;
			};
			unknown: undefined;
		}[T];
	};

	export type SidebarCardComponent = ReactExtended.WritableComponent<{
		avatarAlt: string;
		avatarSrc: string;
		collapsed: boolean;
		"data-a-id": string;
		"data-test-selector": string;
		dispatch: () => unknown;
		isInspecting: boolean;
		isPromoted: boolean;
		isWatchParty: boolean;
		latencyTracking: {};
		latencyTrackingConfig: { isNonCritical: boolean };
		linkTo: {
			pathname: string;
			state: {
				channelView: string;
				content: string;
				content_index: number;
				item_tracking_id: string;
				medium: string;
			};
		};
		metadataLeft: string | ReactExtended.ReactRuntimeElement;
		metadataRight: string | ReactExtended.ReactRuntimeElement;
		offline: boolean;
		onClick: () => void;
		onContextMenu: () => void;
		onMiddleClick: () => void;
		primaryColorHex: string;
		register: () => void;
		rootTrackerExists: boolean;
		title: string;
		titleElement: string | ReactExtended.ReactRuntimeElement;
		tooltipContent: string | ReactExtended.ReactRuntimeElement;
		unregister: () => void;
		userLogin: string;
	}>;

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

	export type MessageCardOpeners = ReactExtended.WritableComponent<{
		onShowViewerCard: (v: any) => void;
		setViewerCardPage: (v: any) => void;
	}> & {
		openUserCard?: (v: string) => void;
	};

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

	export interface ChatUser {
		color: string;
		isIntl: boolean;
		isSubscriber: boolean;
		userDisplayName?: string;
		displayName?: string;
		userID: string;
		userLogin: string;
		userType: string;
		badges?: { id: string }[];
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

	export type VideoPlayerComponent = ReactExtended.WritableComponent<{
		containerRef: HTMLDivElement;
		mediaPlayerInstance: MediaPlayerInstance;
	}>;

	export interface MediaPlayerInstance {
		core: {
			state: PlayerState;
			mediaSinkManager: {
				video: HTMLVideoElement;
			};
		};
		getBufferDuration: () => number;
		getLiveLatency: () => number;
		getDroppedFrames: () => number;
		getVideoBitRate: () => number;
		getVideoFrameRate: () => number;
		getPlaybackRate: () => number;
		getVideoWidth: () => number;
		getVideoHeight: () => number;
		getVolume: () => number;
		isMuted: () => boolean;
		isPaused: () => boolean;
		play: () => void;
		pause: () => void;
		setMuted: (e) => void;
		setVolume: (e) => void;
		setPlaybackRate: (e) => void;
	}

	export type VideoPlayerContentRestriction = ReactExtended.WritableComponent<{
		restriction: string | null;
		restrictions: Record<string, boolean>;
		liftRestriction: (e: string) => void;
		addRestriction: (e: string) => void;
		children: any;
	}>;

	export type MediaPlayerAdvancedControls = ReactExtended.WritableComponent<{}> & {
		setStatsOverlay: (e) => void;
	};

	export type StreamInfo = ReactExtended.WritableComponent<{
		channelID: string;
		channelLogin: string;
		displayName: string;
		guestStarGuests: unknown;
		guestStarSessionID: unknown;
		isLive: boolean;
		isShowingWatchPartyInMain: boolean;
		liveSince?: Date;
	}>;

	export type ModViewViewerCount = ReactExtended.WritableComponent<{}> & {
		DOMNode: HTMLElement;
	};

	export interface PlayerState {
		autoQualityMode: boolean;
		averageBitrate: number;
		bandwidthEstimate: number;
		bufferedPosition: number;
		duration: number;
		liveLatency: number;
		liveLowLatency: boolean;
		liveLowLatencyEnabled: boolean;
		looping: boolean;
		muted: boolean;
		path: string;
		playbackRate: number;
		position: number;
		protocol: string;
		qualities: VideoQuality[];
		quality: VideoQuality;
		sessionId: string;
		startOffset: number;
		state: string;
		statistics: {
			bitrate: number;
			decodedFrames: number;
			droppedFrames: number;
			framerate: number;
			renderedFrames: number;
		};
		volume: number;
	}

	export interface VideoQuality {
		bitrate: number;
		codecs: string;
		framerate: number;
		group: string;
		height: number;
		isDefault: boolean;
		name: string;
		width: number;
	}
}
