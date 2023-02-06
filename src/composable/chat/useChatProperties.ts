import { reactive } from "vue";

const data = reactive({
	isModerator: false,
	isVIP: false,
	isDarkTheme: 1,
	primaryColorHex: null as string | null,
	useHighContrastColors: true,
	showTimestamps: false,
	showModerationIcons: false,
	hovering: false,
	pauseReason: new Set<ChatPauseReason>(["SCROLL"]),
	currentChannel: {} as CurrentChannel,
	imageFormat: "WEBP" as SevenTV.ImageFormat,
	twitchBadgeSets: {} as Twitch.BadgeSets | null,
	blockedUsers: new Set<string>(),
});

type ChatPauseReason = "MOUSEOVER" | "SCROLL" | "ALTKEY";

export function useChatProperties() {
	return data;
}
