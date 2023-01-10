import { getEmoteButton } from "@/site/twitch.tv";
import { darken, hasBadContrast, parseToRgba } from "color2k";

export const tools = {
	emoteClick: (() => null) as Twitch.EmoteButton["props"]["onEmoteClick"],
	userClick: (() => null) as Twitch.MessageCardOpeners["onShowViewerCard"],
};

export const registerCardOpeners = (): boolean => {
	const opener = getEmoteButton();
	if (!opener) {
		return false;
	}

	tools.emoteClick = opener.props.onEmoteClick;

	return true;
};

export const sendDummyMessage = (controller: Twitch.ChatControllerComponent) => {
	controller.pushMessage({
		badges: {},
		user: {
			userDisplayName: "",
			isIntl: false,
			userLogin: "7tvapp",
			userID: "77777777",
			color: "",
			userType: "",
			isSubscriber: false,
		},
		messageParts: [
			{
				type: 6,
				content: {
					images: {
						dark: {
							"1x": "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0",
							"2x": "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0",
							"4x": "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0",
						},
						light: {
							"1x": "https://static-cdn.jtvnw.net/emoticons/v2/25/default/light/1.0",
							"2x": "https://static-cdn.jtvnw.net/emoticons/v2/25/default/light/2.0",
							"4x": "https://static-cdn.jtvnw.net/emoticons/v2/25/default/light/3.0",
						},
						themed: true,
					},
					alt: "",
					emoteID: "-1",
				},
			},
		],
		messageBody: "",
		type: 0,
		messageType: 0,
		id: "seventv-hook-message",
	});
};

const calculated = { 0: {}, 1: {} } as Record<0 | 1, Record<string, string>>;

export function normalizeUsername(color: string, theme: 0 | 1): string {
	let temp = color.toLowerCase();
	const backgroundColor = theme ? "#0f0e11" : "#faf9fa";

	if (!hasBadContrast(temp, "aa", backgroundColor)) return temp;

	// See if we have calculated the value
	const stored = calculated[theme][color];
	if (stored) return stored;

	const rgb = parseToRgba(temp).slice(0, 3);

	if (theme && rgb.every((e) => e < 36)) {
		calculated[theme][color] = "#7a7a7a";
		return "#7a7a7a";
	}

	let i = 0;

	while (hasBadContrast(temp, "aa", backgroundColor) && i < 50) {
		temp = darken(temp, 0.1 * (theme ? -1 : 1));
		i++;
	}

	calculated[theme][color] = temp;

	return temp;
}
