import { reactive } from "vue";

const data = reactive({
	isModerator: false,
	isVIP: false,
	isDarkTheme: 1,
	primaryColorHex: null as string | null,
	useHighContrastColors: true,
	showTimestamps: false,
	showModerationIcons: false,
	currentChannel: {} as CurrentChannel,
	imageFormat: "WEBP" as SevenTV.ImageFormat,
	twitchBadgeSets: {} as Twitch.BadgeSets | null,
	blockedUsers: new Set<string>(),
});

export function useChatProperties() {
	return data;
}
