export namespace Regex {
	export const MessageDelimiter = new RegExp("( )", "g");
	export const Link = new RegExp("^(?:https?:\\/\\/(?:www\\.)?)?([a-z0-9-]+\\.)+[a-z0-9@]{2,6}(\\/[^\\s]*)?$", "gim");
	export const Mention = new RegExp("@([A-Za-z0-9_]{1,24})");
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

export enum MessageType {
	MESSAGE = 0,
	EXTENSION_MESSAGE,
	MODERATION,
	MODERATION_ACTION,
	TARGETED_MODERATION_ACTION,
	AUTOMOD,
	SUBSCRIBER_ONLY_MODE,
	FOLLOWER_ONLY_MODE,
	SLOW_MODE,
	EMOTE_ONLY_MODE,
	R9K_MODE,
	CONNECTED,
	DISCONNECTED,
	RECONNECT,
	HOSTING,
	UNHOST,
	HOSTED,
	SUBSCRIPTION,
	RESUBSCRIPTION,
	GIFT_PAID_UPGRADE,
	ANON_GIFT_PAID_UPGRADE,
	PRIME_PAID_UPGRADE,
	PRIME_COMMUNITY_GIFT_RECEIVED_EVENT,
	EXTEND_SUBSCRIPTION,
	SUB_GIFT,
	ANON_SUB_GIFT,
	CLEAR,
	ROOM_MODS,
	ROOM_STATE,
	RAID,
	UNRAID,
	NOTICE,
	INFO,
	BADGES_UPDATED,
	PURCHASE,
	BITS_CHARITY,
	CRATE_GIFT,
	REWARD_GIFT,
	SUB_MYSTERY_GIFT,
	ANON_SUB_MYSTERY_GIFT,
	STANDARD_PAY_FORWARD,
	COMMUNITY_PAY_FORWARD,
	FIRST_CHEER_MESSAGE,
	FIRST_MESSAGE_HIGHLIGHT,
	BITS_BADGE_TIER_MESSAGE,
	INLINE_PRIVATE_CALLOUT,
	CHANNEL_POINTS_REWARD,
	COMMUNITY_CHALLENGE_CONTRIBUTION,
	LIVE_MESSAGE_SEPARATOR,
	RESTRICTED_LOW_TRUST_USER_MESSAGE,
	COMMUNITY_INTRODUCTION,
	SHOUTOUT,
	ANNOUNCEMENT_MESSAGE,
	MIDNIGHT_SQUID,
	CHARITY_DONATION,
	MESSAGE_ID_UPDATE,
	PINNED_CHAT,

	// 7TV Message Types
	SEVENTV_EMOTE_SET_UPDATE = 7000,
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
