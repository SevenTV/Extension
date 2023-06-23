import { Ref } from "vue";
import { useConfig } from "@/composable/useSettings";

const hideLeaderboard = useConfig<boolean>("layout.hide_channel_leaderboard");
const hideButtonsBelowChatbox = useConfig<boolean>("layout.hide_buttons_below_chatbox");
const hideStreamChatBar = useConfig<boolean>("layout.hide_stream_chat_bar");
const hideReactButtons = useConfig<boolean>("layout.hide_react_buttons");
const hideBitsButtons = useConfig<boolean>("layout.hide_bits_buttons");
const hideHypeChatButton = useConfig<boolean>("layout.hide_hype_chat_button");
const hideTopBarOfStream = useConfig<boolean>("layout.hide_top_bar_of_stream");
const hidePlayerControls = useConfig<boolean>("layout.hide_player_controls");
const hidePinnedHypeChats = useConfig<boolean>("layout.hide_pinned_hype_chats");
const hideCommunityHighlights = useConfig<boolean>("layout.hide_community_highlights");
const hideRecommendedChannels = useConfig<boolean>("layout.hide_recommended_channels");
const hideViewersAlsoWatch = useConfig<boolean>("layout.hide_viewers_also_watch");
const hidePrimeOffers = useConfig<boolean>("layout.hide_prime_offers");
const hideUnfollowButton = useConfig<boolean>("layout.hide_unfollow_button");
const hideLiveNotificationButton = useConfig<boolean>("layout.hide_live_notification_button");
const hideSubscribeButton = useConfig<boolean>("layout.hide_subscribe_button");
const hideChatInputBox = useConfig<boolean>("layout.hide_chat_input_box");

export const hiddenElementSettings: Array<{ class: string; isHidden: Ref<boolean> }> = [
	{ class: "seventv-hide-leaderboard", isHidden: hideLeaderboard },
	{ class: "seventv-hide-buttons-below-chatbox", isHidden: hideButtonsBelowChatbox },
	{ class: "seventv-hide-stream-chat-bar", isHidden: hideStreamChatBar },
	{ class: "seventv-hide-react-buttons", isHidden: hideReactButtons },
	{ class: "seventv-hide-bits-buttons", isHidden: hideBitsButtons },
	{ class: "seventv-hide-hype-chat-button", isHidden: hideHypeChatButton },
	{ class: "seventv-hide-top-bar-of-stream", isHidden: hideTopBarOfStream },
	{ class: "seventv-hide-player-controls", isHidden: hidePlayerControls },
	{ class: "seventv-hide-pinned-hype-chats", isHidden: hidePinnedHypeChats },
	{ class: "seventv-hide-community-highlights", isHidden: hideCommunityHighlights },
	{ class: "seventv-hide-recommended-channels", isHidden: hideRecommendedChannels },
	{ class: "seventv-hide-viewers-also-watch", isHidden: hideViewersAlsoWatch },
	{ class: "seventv-hide-prime-offers", isHidden: hidePrimeOffers },
	{ class: "seventv-hide-unfollow-button", isHidden: hideUnfollowButton },
	{ class: "seventv-hide-live-notification-button", isHidden: hideLiveNotificationButton },
	{ class: "seventv-hide-subscribe-button", isHidden: hideSubscribeButton },
	{ class: "seventv-hide-chat-input-box", isHidden: hideChatInputBox },
];
