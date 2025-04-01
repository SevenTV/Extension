import { reactive } from "vue";
import { ChannelContext } from "../channel/useChannelContext";

interface ChatProperties {
	fontAprilFools: string;
	isDarkTheme: number;
	primaryColorHex: string | null;
	useHighContrastColors: boolean;
	showTimestamps: boolean;
	showModerationIcons: boolean;
	hovering: boolean;
	pauseReason: Set<ChatPauseReason>;
	currentChannel: CurrentChannel;
	imageFormat: SevenTV.ImageFormat;
	twitchBadgeSets: Twitch.BadgeSets | null;
	blockedUsers: Set<string>;
}

type ChatPauseReason = "MOUSEOVER" | "SCROLL" | "ALTKEY";

const m = new WeakMap<ChannelContext, ChatProperties>();

export function useChatProperties(ctx: ChannelContext) {
	let data = m.get(ctx);
	if (!data) {
		data = reactive<ChatProperties>({
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
			fontAprilFools: "unset",
		});

		m.set(ctx, data);
	}

	return data;
}
