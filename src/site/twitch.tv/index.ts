export function findReactParents(
	node: any,
	predicate: Twitch.FindReactInstancePredicate,
	maxDepth = 15,
): Twitch.AnyPureComponent | null {
	let travel = 0;
	while (node && travel <= maxDepth) {
		try {
			let match = predicate?.(node);
			if (match) return node;
		} catch (e) {}

		node = node.return;
		travel++;
	}

	return null;
}

export function findReactChildren(
	node: any,
	predicate: Twitch.FindReactInstancePredicate,
	maxDepth = 15,
): Twitch.AnyPureComponent | null {
	let path: any[] = [];

	for (;;) {
		if (!node || path.length > maxDepth) {
			let parent = path.pop();
			if (parent) {
				node = parent.sibling;
				continue;
			} else {
				break;
			}
		}

		try {
			let match = predicate?.(node);
			if (match) return node;
		} catch (e) {}

		path.push(node);
		node = node.child || node.sibling;
	}

	return null;
}

export function getReactInstance(el: Element | null): (React.Component & { [x: string]: any }) | undefined {
	for (const k in el) {
		if (k.startsWith("__reactInternalInstance$")) {
			return (el as any)[k] as any;
		}
	}
}

export function getRouter(): Twitch.RouterComponent {
	const node = findReactChildren(
		getReactInstance(document.querySelectorAll(Selectors.MainLayout)[0]),
		n => n.stateNode?.props?.history?.listen,
		100,
	);

	return node?.stateNode;
}

export function getUser(): Twitch.UserComponent {
	const node = findReactParents(
		getReactInstance(document.querySelector("button[data-a-target='user-menu-toggle']")),
		n => n.stateNode?.props?.user,
		100,
	);

	return node?.stateNode;
}

export function getChatService(): Twitch.ChatServiceComponent {
	const node = findReactChildren(
		getReactInstance(document.querySelectorAll(Selectors.MainLayout)[0]),
		n => n.stateNode?.join && n.stateNode?.client,
		500,
	);

	return node?.stateNode;
}

export function getChatController(): Twitch.ChatControllerComponent {
	const node = findReactParents(
		getReactInstance(document.querySelectorAll(Selectors.ChatContainer)[0]),
		n => n.stateNode?.props.messageHandlerAPI && n.stateNode?.props.chatConnectionAPI,
		100,
	);

	return node?.stateNode;
}

export function getChatMessageContainer(): { inst: Twitch.AnyPureComponent; el: HTMLElement } {
	const el = document.querySelector(".chat-list--default");
	const node = findReactParents(
		getReactInstance(el),
		n => n.stateNode && n.stateNode.props && n.stateNode.props.messages,
		100,
	);

	return { inst: node?.stateNode, el: el as HTMLElement };
}

/**
 * Gets the channel's id and display name for a video.
 * Note: VOD and clips do not have the channel name in
 * the URL nor do they contain a chat controller with the info.
 */
export function getVideoChannel(): Twitch.VideoChannelComponent {
	const node = findReactParents(
		getReactInstance(document.querySelectorAll(Selectors.VideoChatContainer)[0]),
		n => n.stateNode?.props.channelID && n.stateNode?.props.displayName,
		100,
	);

	// Kinda hacky? However, display names are merely
	// case variations of the pure lowercase channel logins.
	if (node?.stateNode?.props) {
		node.stateNode.props.channelLogin = node.stateNode.props.displayName.toLowerCase();
	}

	return node?.stateNode;
}

export function getChatScroller(): Twitch.ChatScrollerComponent {
	const node = findReactParents(
		getReactInstance(document.querySelector(".scrollable-area")),
		n => n.stateNode.props["data-a-target"] === ("chat-scroller" as any),
		10,
	);

	return node?.stateNode;
}

export function getChat(): Twitch.ChatComponent {
	const node = findReactParents(
		getReactInstance(document.querySelectorAll(Selectors.ChatContainer)[0]),
		n => n.stateNode?.props.onSendMessage,
	);

	return node?.stateNode;
}

/**
 * Gets info for the VOD or clip, including the video id, playback location, and current messages/comments.
 */
export function getVideoChat(): Twitch.VideoChatComponent {
	const node = findReactParents(
		getReactInstance(document.querySelectorAll(Selectors.VideoChatContainer)[0]),
		n => n.stateNode?.props.comments && n.stateNode?.props.onCreate,
		5,
	);

	return node?.stateNode;
}

export function getInputController(): Twitch.ChatInputController {
	const node = findReactParents(
		getReactInstance(document.querySelectorAll("div.chat-input")[0]),
		n => n.stateNode?.props.onSendMessage,
	);
	return node?.stateNode;
}

export function getChatInput(): Twitch.ChatInputComponent {
	return getAutocompleteHandler()?.componentRef;
}

export function getAutocompleteHandler(): Twitch.ChatAutocompleteComponent {
	const node = findReactChildren(
		getReactInstance(document.querySelector(".chat-input__textarea")),
		n => n.stateNode.providers,
	);

	return node?.stateNode;
}

export function getEmotePicker(): Twitch.AnyPureComponent {
	const node = findReactParents(
		getReactInstance(document.querySelector("[data-a-target=emote-picker]")),
		n => !(n.stateNode instanceof HTMLElement) && n.stateNode !== null,
	);

	return node as any;
}

/**
 * Get an individual chat line
 */
export function getChatLine(el: HTMLElement): Twitch.ChatLineAndComponent {
	const inst = getReactInstance(el);

	return {
		component: inst?.return?.stateNode,
		inst: inst as Twitch.TwitchPureComponent,
		element: inst?.stateNode,
	};
}

/**
 * Get chat lines with the element & react component, optionally filtered by an ID list
 */
export function getChatLines(container: HTMLElement, idList?: string[]): Twitch.ChatLineAndComponent[] {
	let lines = Array.from(container.children).map(element => {
		const chatLine = getChatLine(element as HTMLElement);

		return {
			element,
			component: chatLine.component,
			inst: chatLine.inst,
		};
	});

	if (!!idList) {
		lines = lines.filter(({ component }) => idList?.includes((component?.props as any)?.message?.id));
	}

	return lines as Twitch.ChatLineAndComponent[];
}

export function getEmoteButton(): Twitch.EmoteButton {
	const node = findReactParents(
		getReactInstance(document.querySelector("[data-test-selector='emote-button']")),
		n => n.stateNode?.props?.onEmoteClick,
		10,
	);

	return node?.stateNode;
}

export function getMessageCardOpeners(): Twitch.MessageCardOpeners {
	const inst = document.querySelector(Selectors.ChatContainer);

	// This has to walk deep FeelsDankMan
	const opener = findReactParents(getReactInstance(inst), n => n.stateNode.onShowEmoteCard, 200);

	return opener?.stateNode;
}

export namespace Selectors {
	export const ROOT = "#root div";
	export const NAV = '[data-a-target="top-nav-container"]';
	export const MainLayout =
		'main.twilight-main, #root.sunlight-root > div:nth-of-type(3), #root[data-a-page-loaded-name="PopoutChatPage"] > div, #root[data-a-page-loaded-name="ModerationViewChannelPage"] > div:nth-of-type(1)';
	export const ChatContainer = 'section[data-test-selector="chat-room-component-layout"]';
	export const VideoChatContainer = "div.video-chat.va-vod-chat";
	export const ChatScrollableContainer = ".chat-scrollable-area__message-container";
	export const ChatLine = ".chat-line__message";
	export const VideoChatMessage = ".vod-message > div:not(.vod-message__header) > div";
	export const ChatInput = ".chat-input__textarea";
	export const ChatInputButtonsContainer = 'div[data-test-selector="chat-input-buttons-container"]';
	export const ChatMessageContainer = ".chat-line__message-container";
	export const ChatUsernameContainer = ".chat-line__username-container";
	export const ChatAuthorDisplayName = ".chat-author__display-name";
	export const ChatMessageBadges = ".chat-line__message--badges";
	export const ChatMessageUsername = ".chat-line__usernames";
	export const ChatMessageTimestamp = ".chat-line__timestamp";
}
