import { Ref } from "vue";
import { useConfig } from "@/composable/useSettings";

const hideLeaderboard = useConfig<boolean>("hide.channel_leaderboard");
const hideButtonsBelowChatbox = useConfig<boolean>("hide.buttons_below_chatbox");
const hideStreamChatBar = useConfig<boolean>("hide.stream_chat_bar");
const hideReactButtons = useConfig<boolean>("hide.react_buttons");
const hideBitsButtons = useConfig<boolean>("hide.bits_buttons");
const hideTopBarOfStream = useConfig<boolean>("hide.top_bar_of_stream");
const hidePlayerControls = useConfig<boolean>("hide.player_controls");
const hideCommunityHighlights = useConfig<boolean>("hide.community_highlights");
const hideRecommendedChannels = useConfig<boolean>("hide.recommended_channels");
const hideViewersAlsoWatch = useConfig<boolean>("hide.viewers_also_watch");
const hidePrimeOffers = useConfig<boolean>("hide.prime_offers");
const hideUnfollowButton = useConfig<boolean>("hide.unfollow_button");
const hideLiveNotificationButton = useConfig<boolean>("hide.live_notification_button");
const hideSubscribeButton = useConfig<boolean>("hide.subscribe_button");
const hideChatInputBox = useConfig<boolean>("hide.chat_input_box");

export const hiddenElementSettings: Array<{ class: string; isHidden: Ref<boolean> }> = [
	{ class: "seventv-hide-leaderboard", isHidden: hideLeaderboard },
	{ class: "seventv-hide-buttons-below-chatbox", isHidden: hideButtonsBelowChatbox },
	{ class: "seventv-hide-stream-chat-bar", isHidden: hideStreamChatBar },
	{ class: "seventv-hide-react-buttons", isHidden: hideReactButtons },
	{ class: "seventv-hide-bits-buttons", isHidden: hideBitsButtons },
	{ class: "seventv-hide-top-bar-of-stream", isHidden: hideTopBarOfStream },
	{ class: "seventv-hide-player-controls", isHidden: hidePlayerControls },
	{ class: "seventv-hide-community-highlights", isHidden: hideCommunityHighlights },
	{ class: "seventv-hide-recommended-channels", isHidden: hideRecommendedChannels },
	{ class: "seventv-hide-viewers-also-watch", isHidden: hideViewersAlsoWatch },
	{ class: "seventv-hide-prime-offers", isHidden: hidePrimeOffers },
	{ class: "seventv-hide-unfollow-button", isHidden: hideUnfollowButton },
	{ class: "seventv-hide-live-notification-button", isHidden: hideLiveNotificationButton },
	{ class: "seventv-hide-subscribe-button", isHidden: hideSubscribeButton },
	{ class: "seventv-hide-chat-input-box", isHidden: hideChatInputBox },
];
