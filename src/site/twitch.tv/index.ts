export namespace Regex {
	export const MessageDelimiter = new RegExp("( )", "g");
	export const Mention = new RegExp("@([A-Za-z0-9_]{1,24})");
	export const SevenTVLink = new RegExp("https?:\\/\\/(?:www\\.)?7tv.app\\/emotes\\/(?<emoteID>[0-9a-f]{24})", "i");
	export const EmoteID = new RegExp("[0-9a-f]{24}");
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
	EXTENSION_MESSAGE = 1,
	MODERATION = 2,
	MODERATION_ACTION = 3,
	TARGETED_MODERATION_ACTION = 4,
	AUTO_MOD = 5,
	SUBSCRIBER_ONLY_MODE = 6,
	FOLLOWER_ONLY_MODE = 7,
	SLOW_MODE = 8,
	EMOTE_ONLY_MODE = 9,
	R9K_MODE = 10,
	CONNECTED = 11,
	DISCONNECTED = 12,
	RECONNECT = 13,
	SUBSCRIPTION = 14,
	RESUBSCRIPTION = 15,
	GIFT_PAID_UPGRADE = 16,
	ANON_GIFT_PAID_UPGRADE = 17,
	PRIME_PAID_UPGRADE = 18,
	PRIME_COMMUNITY_GIFT_RECEIVED_EVENT = 19,
	EXTEND_SUBSCRIPTION = 20,
	SUB_GIFT = 21,
	ANON_SUB_GIFT = 22,
	CLEAR = 23,
	ROOM_MODS = 24,
	ROOM_STATE = 25,
	RAID = 26,
	UNRAID = 27,
	NOTICE = 28,
	INFO = 29,
	BADGES_UPDATED = 30,
	PURCHASE = 31,
	BITS_CHARITY = 32,
	CRATE_GIFT = 33,
	REWARD_GIFT = 34,
	SUB_MYSTERY_GIFT = 35,
	ANON_SUB_MYSTERY_GIFT = 36,
	STANDARD_PAY_FORWARD = 37,
	COMMUNITY_PAY_FORWARD = 38,
	FIRST_CHEER_MESSAGE = 39,
	FIRST_MESSAGE_HIGHLIGHT = 40,
	BITS_BADGE_TIER_MESSAGE = 41,
	INLINE_PRIVATE_CALLOUT = 42,
	CHANNEL_POINTS_REWARD = 43,
	COMMUNITY_CHALLENGE_CONTRIBUTION = 44,
	LIVE_MESSAGE_SEPARATOR = 45,
	RESTRICTED_LOW_TRUST_USER_MESSAGE = 46,
	COMMUNITY_INTRODUCTION = 47,
	SHOUTOUT = 48,
	ANNOUNCEMENT_MESSAGE = 49,
	CHARITY_DONATION = 50,
	MESSAGE_ID_UPDATE = 51,
	VIEWER_MILESTONE = 52,

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
