import { DataStructure } from '@typings/typings/DataStructure';
import * as React from 'react';
import { MessagePatcher } from 'src/Page/Util/MessagePatcher';

export class Twitch {
	findReactParents(node: any, predicate: Twitch.FindReactInstancePredicate, maxDepth = 15, depth = 0): Twitch.AnyPureComponent | null {
		let success = false;
		try { success = predicate(node); } catch (_) {}
		if (success) return node;
		if (!node || depth > maxDepth) return null;

		const { 'return': parent } = node;
		if (parent) {
			return this.findReactParents(parent, predicate, maxDepth, depth + 1);
		}

		return null;
	}

	findReactChildren(node: any, predicate: Twitch.FindReactInstancePredicate, maxDepth = 15, depth = 0): Twitch.AnyPureComponent | null {
		let success = false;
		try { success = predicate(node); } catch (_) {}
		if (success) return node;
		if (!node || depth > maxDepth) return null;

		const { child, sibling } = node;
		if (child || sibling) {
			return this.findReactChildren(child, predicate, maxDepth, depth + 1) || this.findReactChildren(sibling, predicate, maxDepth, depth + 1);
		}

		return null;
	}

	getReactInstance(el: Element | null): (React.Component & { [x: string]: any; }) | undefined {
		for (const k in el) {
			if (k.startsWith('__reactInternalInstance$')) {
				return (el as any)[k] as any;
			}
		}
	}

	getChatService(): Twitch.ChatServiceComponent {
		const node = this.findReactChildren(
			this.getReactInstance(document.querySelectorAll(Twitch.Selectors.ROOT)[0]),
			n => n.stateNode?.join && n.stateNode?.client,
			1000
		);

		return node?.stateNode;
	}

	getChatController(): Twitch.ChatControllerComponent {
		const node = this.findReactParents(
			this.getReactInstance(document.querySelectorAll(Twitch.Selectors.ChatContainer)[0]),
			n => n.stateNode?.props.messageHandlerAPI && n.stateNode?.props.chatConnectionAPI,
			1000
		);

		return node?.stateNode;
	}

	getChat(): Twitch.ChatComponent {
		const node = this.findReactParents(
			this.getReactInstance(document.querySelectorAll(Twitch.Selectors.ChatContainer)[0]),
			n => n.stateNode?.props.onSendMessage
		);

		return node?.stateNode;
	}

	getEmotePicker(): Twitch.AnyPureComponent {
		const node = this.findReactParents(
			this.getReactInstance(document.querySelector('[data-a-target=emote-picker]')),
			n => !(n.stateNode instanceof HTMLElement) && n.stateNode !== null
		);

		return node as any;
	}

	/**
	 * Get an individual chat line
	 */
	getChatLine(el: HTMLElement): Twitch.GetChatLineResult {
		const inst = this.getReactInstance(el);
		const separator = this.findReactChildren(inst,
			n => n.key === 'separator',
			1000
		);

		return {
			component: inst?.return?.stateNode,
			separatorComponent: separator as Twitch.TwitchPureComponent,
			instance: inst as Twitch.TwitchPureComponent
		};
	}

	/**
	 * Get chat lines with the element & react component, optionally filtered by an ID list
	 */
	getChatLines(idList?: string[]): Twitch.ChatLineAndComponent[] {
		let lines = Array.from(document.querySelectorAll<HTMLElement>(Twitch.Selectors.ChatLine))
			.map(element => {
				const chatLine = this.getChatLine(element);

				return {
					element,
					component: chatLine.component,
					separatorComponent: chatLine.separatorComponent,
					inst: chatLine.instance
				};
			});

		if (!!idList) {
			lines = lines.filter(({ component }) => idList?.includes((component?.props as any)?.message?.id));
		}

		return lines as Twitch.ChatLineAndComponent[];
	}
}

export namespace Twitch {
	export namespace Selectors {
		export const ROOT = '#root div';
		export const ChatContainer = 'section[data-test-selector="chat-room-component-layout"]';
		export const ChatScrollableContainer = '.chat-scrollable-area__message-container';
		export const ChatLine = '.chat-line__message';
		export const ChatInput = '.chat-input textarea';
		export const ChatInputButtonsContainer = 'div[data-test-selector="chat-input-buttons-container"]';
		export const ChatMessageContainer = '.chat-line__message-container';
		export const ChatUsernameContainer = '.chat-line__username-container';
		export const ChatAuthorDisplayName = '.chat-author__display-name';
		export const ChatMessageBadges = '.chat-line__message--badges';
		export const ChatMessageUsername = '.chat-line__usernames';
		export const ChatMessageTimestamp = '.chat-line__timestamp';
	}


	export type FindReactInstancePredicate = (node: any) => boolean;
	export type AnyPureComponent = React.PureComponent & { [x: string]: any; };
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

	export interface GetChatLineResult {
		instance: TwitchPureComponent;
		component: AnyPureComponent;
		separatorComponent: TwitchPureComponent | null;
	}
	export interface ChatLineAndComponent {
		element: HTMLDivElement;
		inst: TwitchPureComponent;
		component: ChatLineComponent;
		separatorComponent: TwitchPureComponent | null;
	}
	export type ChatLineComponent = React.PureComponent<{
		badgeSets: BadgeSets;
		channelID: string;
		channelLogin: string;
		confirmModerationAction: Function;
		currentUserDisplayName: string;
		currentUserID: string;
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
			show: Function; showRich: Function; hide: Function;
		}
		useHighContrastColors: boolean;
	}>;

	export type ChatServiceComponent = React.PureComponent<{
		authToken: string;
		channelLogin: string;
		channelID: string;
	}> & {
		service: {
			client: {
				events: {
					joined: (fn: (x: { channel: string; gotUsername: boolean; username: string; }) => void) => void;
				}
			};
		}
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
			removeMessageHandler: ((event: ChatMessage) => void);
			handleMessage: () => void;
		}
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
		pushMessage: (msg: { id: string; msgid: string; channel: string; type: number; message: any; }) => void;
	};

	export type ChatComponent = React.PureComponent<{
		authToken: string;
		bitsConfig: {
			getImage: (n: any, i: any, a: any, r: any, s: any) => any;
			indexedActions: { [key: string]: {
				id: string;
				prefix: string;
				type: string;
				campaign: string | null;
				tiers: { id: string; bits: number; canShowInBitsCard: boolean; __typename: string; };
				template: string;
				__typename: string;
			}}
		};
		bitsEnabled: boolean;
		channelDisplayName: string;
		channelID: string;
		channelLogin: string;
		chatRoomHeader: any;
		chatRules: string[];
		chatView: number;
		location: {
			hash: string;
			pathname: string;
			search: string;
			state: any;
		};
		userBadges: { [key: string]: ('1' | '0') };
		userID: string;
	}, {
		badgeSets: BadgeSets;
		chatListElement: HTMLDivElement;
	}>;

	export interface BadgeSets {
		channelsBySet: Map<string, Map<string, ChatBadge>>;
		count: number;
		globalsBySet: Map<string, Map<string, ChatBadge>>;
	}

	export interface ChatBadge {
		clickAction?: string;
		clickURL?: string;
		click_action?: string;
		click_url?: string;
		id: string;
		image1x: string;
		image2x?: string;
		image4x: string;
		setID: string;
		title: string;
		version: string;
		__typename: string;
	}

	export interface ChatMessage {
		badgesDynamicData: {};
		badges: { [key: string]: ('1' | '0') };
		banned: boolean;
		bits: number;
		deleted: boolean;
		hidden: boolean;
		id: string;
		isHistorical: unknown;
		seventv: {
			patcher: MessagePatcher | null;
			words: string[];
			parts: ChatMessage.AppPart[];
			badges?: ChatBadge[];
			is_slash_me?: boolean;
		};
		message: string;
		messageBody: string;
		messageParts: ChatMessage.Part[];
		messageType: number;
		reply: unknown;
		user: ChatUser;

		// Other third party things
		ffz_tokens?: {
			big: boolean;
			can_big?: boolean;
			modifiers: any[];
			provider: string;
			src: string; src2: string; srcSet: string; srcSet2: string;
			text: string;
			type: 'emote' | 'text';
		}[];
		ffz_emotes: any;
		emotes?: any;
		_ffz_checked?: boolean;

	}
	export namespace ChatMessage {
		export interface Part {
			content: string | EmoteRef | { [key: string]: any; };
			type: number;
		}

		export interface EmoteRef {
			alt: string;
			emoteID?: string;
			images?: {
				dark: {
					'1x': string; '2x': string; '3x': string; '4x': string;
				};
				light: {
					'1x': string; '2x': string; '3x': string; '4x': string;
				};
				themed: boolean;
			};
		}

		export interface AppPart {
			type: 'text' | 'emote' | 'link' | 'mention';
			content?: string | { [key: string]: any; };
		}
	}

	export interface ChatUser {
		color: string;
		isIntl: boolean;
		displayName: string;
		userDisplayName: string;
		userID: string;
		userLogin: string;
		userType: string;
	}
}
