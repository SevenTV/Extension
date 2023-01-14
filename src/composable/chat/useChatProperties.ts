import { reactive, toRefs } from "vue";

const data = reactive({
	isModerator: false,
	isVIP: false,
	isDarkTheme: 1,
	primaryColorHex: "#000000",
	useHighContrastColors: true,
	showTimestamps: false,
	currentChannel: {} as CurrentChannel,
	imageFormat: "AVIF" as SevenTV.ImageFormat,
	twitchBadgeSets: {} as Twitch.BadgeSets | null,
});

export function useChatProperties() {
	return toRefs(data);
}
