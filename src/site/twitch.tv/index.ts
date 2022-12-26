/* eslint-disable @typescript-eslint/no-explicit-any */
import { findComponentChildren, findComponentParents, getVNodeFromDOM } from "../../common/ReactHooks";

export function getRouter(): Twitch.RouterComponent | undefined {
	const parentEl = document.querySelector(Selectors.MainLayout);
	if (!parentEl) return undefined;

	const parent = getVNodeFromDOM(parentEl);
	if (!parent) return undefined;

	const [node] = findComponentChildren(parent, (n) => n.props?.history?.listen, 100, 1);

	if (node) return node;
}

export function getUser(): Twitch.UserComponent | undefined {
	const parentEl = document.querySelector("button[data-a-target='user-menu-toggle']");
	if (!parentEl) return undefined;

	const parent = getVNodeFromDOM(parentEl);
	if (!parent) return undefined;

	const [node] = findComponentParents(parent, (n) => n.props?.user, 100, 1);

	if (node) return node;
}

export function getChatController(): Twitch.ChatControllerComponent | undefined {
	const parentEl = document.querySelector(Selectors.ChatContainer);
	if (!parentEl) return undefined;

	const parent = getVNodeFromDOM(parentEl);
	if (!parent) return undefined;

	const [node] = findComponentParents(
		parent,
		(n) => n.props?.messageHandlerAPI && n.props?.chatConnectionAPI,
		100,
		1,
	);

	if (node) return node as Twitch.ChatControllerComponent;
}

export function getEmoteButton(): Twitch.EmoteButton | undefined {
	const parentEl = document.querySelector("[data-test-selector='emote-button']");
	if (!parentEl) return undefined;

	const parent = getVNodeFromDOM(parentEl);
	if (!parent) return undefined;

	const [node] = findComponentParents(parent, (n) => n.props?.onEmoteClick, 10, 1);

	if (node) return node as Twitch.EmoteButton;
}

/**
 * Get an individual chat line
 */
export function getChatLine(el: HTMLElement) {
	const node = getVNodeFromDOM(el);
	if (!node) return undefined;

	return {
		component: node?.return?.stateNode as Twitch.ChatLineComponent,
		inst: node,
		element: node?.stateNode,
	};
}

/**
 * Get chat lines with the element & react component, optionally filtered by an ID list
 */
export function getChatLines(container: HTMLElement, idList?: string[]) {
	let lines = Array.from(container.children).map((element) => {
		const chatLine = getChatLine(element as HTMLElement);

		return {
			element,
			component: chatLine?.component,
			inst: chatLine?.inst,
		};
	});

	if (idList) {
		lines = lines.filter(({ component }) => idList?.includes((component as any)?.props?.message?.id));
	}

	return lines;
}

export namespace Regex {
	export const MessageDelimiter = new RegExp("( )", "g");
	export const SevenTVLink = new RegExp("^https?:\\/\\/(?:www\\.)?7tv.app\\/emotes\\/(?<emoteID>[0-9a-f]{24})", "gi");
}

export namespace Selectors {
	export const ROOT = "#root div";
	export const NAV = "[data-a-target='top-nav-container']";
	export const MainLayout =
		"main.twilight-main, #root.sunlight-root > div:nth-of-type(3), #root[data-a-page-loaded-name='PopoutChatPage'] > div, #root[data-a-page-loaded-name='ModerationViewChannelPage'] > div:nth-of-type(1)";
	export const ChatContainer = "section[data-test-selector='chat-room-component-layout']";
	export const VideoChatContainer = "div.video-chat.va-vod-chat";
	export const ChatScrollableContainer = ".chat-scrollable-area__message-container";
	export const ChatLine = ".chat-line__message";
	export const VideoChatMessage = ".vod-message > div:not(.vod-message__header) > div";
	export const ChatInput = ".chat-input__textarea";
	export const ChatInputButtonsContainer = "div[data-test-selector='chat-input-buttons-container']";
	export const ChatMessageContainer = ".chat-line__message-container";
	export const ChatList = ".chat-list--default ";
	export const ChatUsernameContainer = ".chat-line__username-container";
	export const ChatAuthorDisplayName = ".chat-author__display-name";
	export const ChatMessageBadges = ".chat-line__message--badges";
	export const ChatMessageUsername = ".chat-line__usernames";
	export const ChatMessageTimestamp = ".chat-line__timestamp";
}

export const enum MessageType {
	MESSAGE = 0,
	EXTENSIONMESSAGE,
	MODERATION,
	MODERATIONACTION,
	TARGETEDMODERATIONACTION,
	AUTOMOD,
	SUBSCRIBERONLYMODE,
	FOLLOWERONLYMODE,
	SLOWMODE,
	EMOTEONLYMODE,
	R9KMODE,
	CONNECTED,
	DISCONNECTED,
	RECONNECT,
	HOSTING,
	UNHOST,
	HOSTED,
	SUBSCRIPTION,
	RESUBSCRIPTION,
	GIFTPAIDUPGRADE,
	ANONGIFTPAIDUPGRADE,
	PRIMEPAIDUPGRADE,
	PRIMECOMMUNITYGIFTRECEIVEDEVENT,
	EXTENDSUBSCRIPTION,
	SUBGIFT,
	ANONSUBGIFT,
	CLEAR,
	ROOMMODS,
	ROOMSTATE,
	RAID,
	UNRAID,
	NOTICE,
	INFO,
	BADGESUPDATED,
	PURCHASE,
	BITSCHARITY,
	CRATEGIFT,
	REWARDGIFT,
	SUBMYSTERYGIFT,
	ANONSUBMYSTERYGIFT,
	STANDARDPAYFORWARD,
	COMMUNITYPAYFORWARD,
	FIRSTCHEERMESSAGE,
	FIRSTMESSAGEHIGHLIGHT,
	BITSBADGETIERMESSAGE,
	INLINEPRIVATECALLOUT,
	CHANNELPOINTSREWARD,
	COMMUNITYCHALLENGECONTRIBUTION,
	LIVEMESSAGESEPARATOR,
	RESTRICTEDLOWTRUSTUSERMESSAGE,
	COMMUNITYINTRODUCTION,
	SHOUTOUT,
	ANNOUNCEMENTMESSAGE,
	MIDNIGHTSQUID,
	CHARITYDONATION,
	MESSAGEIDUPDATE,
	PINNEDCHAT,
}

export const enum ModerationType {
	BAN = 0,
	TIMEOUT,
	DELETE,
}

export const enum MessagePartType {
	TEXT = 0,
	MODERATEDTEXT,
	FLAGGEDSEGMENT,
	CURRENTUSERHIGHLIGHT,
	MENTION,
	LINK,
	EMOTE,
	CLIPLINK,
	VIDEOLINK,
	SEVENTVEMOTE = 700,
	SEVENTVLINK,
}
