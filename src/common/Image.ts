import { useChatProperties } from "@/composable/chat/useChatProperties";

const properties = useChatProperties();

const layout = {
	TWITCH: [1, 2, 3],
	"7TV": [1, 2, 3],
	FFZ: [1, 2, 4],
	BTTV: [1, 2, 4],
};

export function imageHostToSrcset(
	host: SevenTV.ImageHost,
	provider: SevenTV.Provider = "7TV",
	format?: SevenTV.ImageFormat,
): string {
	return (provider === "7TV" ? host.files.filter((f) => f.format === format ?? properties.imageFormat) : host.files)
		.slice(0, layout[provider][layout[provider].length - 1])
		.reduce(
			(pre, cur, i, a) => pre + `https:${host.url}/${cur.name} ${layout[provider][i]}x` + (a[i + 1] ? ", " : ""),
			"",
		);
}

export function imageHostToSrcsetWithsize(
	height: number,
	width: number,
	host: SevenTV.ImageHost,
	provider: SevenTV.Provider = "7TV",
): string {
	return (provider == "7TV" ? host.files.filter((f) => f.format === properties.imageFormat) : host.files).reduce(
		(pre, cur, i) =>
			pre + `https:${host.url}/${cur.name} ${width * layout[provider][i]}w ${height * layout[provider][i]}h, `,
		"",
	);
}

export function determineRatio(emote: SevenTV.ActiveEmote) {
	const { width, height } = emote.data?.host.files.at(-1) ?? {};

	if (!width || !height) return 1;

	const ratio = width / height;

	if (ratio <= 1) return 1;
	else if (ratio <= 1.5625) return 2;
	else if (ratio <= 2.125) return 3;
	return 4;
}
