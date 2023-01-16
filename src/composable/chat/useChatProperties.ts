import { reactive, toRefs } from "vue";

const data = reactive({
	isModerator: false,
	isVIP: false,
	isDarkTheme: 1,
	primaryColorHex: null as string | null,
	useHighContrastColors: true,
	showTimestamps: false,
	currentChannel: {} as CurrentChannel,
	imageFormat: "AVIF" as SevenTV.ImageFormat,
	twitchBadgeSets: {} as Twitch.BadgeSets | null,
	blockedUsers: new Set<string>(),
});

export function useChatProperties() {
	return toRefs(data);
}
