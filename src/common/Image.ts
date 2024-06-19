import { useUserAgent } from "@/composable/useUserAgent";

const layout = {
	PLATFORM: [1, 2, 4],
	"7TV": [1, 2, 3, 4],
	FFZ: [1, 2, 4],
	BTTV: [1, 2, 4],
	EMOJI: [],
};

const known = {} as Record<string, string>;

export function imageHostToSrcset(
	host: SevenTV.ImageHost,
	provider: SevenTV.Provider = "7TV",
	format?: SevenTV.ImageFormat,
	maxSize?: number,
	targetSize = 1,
): string {
	if (targetSize === 1 && known[host.url]) return known[host.url];

	const { preferredFormat } = useUserAgent();

	let sizes = host.files;

	if (provider === "7TV") {
		sizes = sizes.filter((f) => f.format === (format ?? preferredFormat));
	}

	let srcset = "";
	for (let i = 0; i < sizes.length; i++) {
		const size = sizes[i];

		let multiplier = layout[provider][i];
		if (!multiplier) break;

		if (maxSize && multiplier > targetSize && multiplier > maxSize) break;

		multiplier /= targetSize;

		if (srcset) srcset += ", ";
		srcset += `https:${host.url}/${size.name} ${multiplier}x`;
	}

	if (targetSize === 1) known[host.url] = srcset;
	return srcset;
}

export function imageHostToSrcsetWithsize(
	height: number,
	width: number,
	host: SevenTV.ImageHost,
	provider: SevenTV.Provider = "7TV",
): string {
	const { preferredFormat } = useUserAgent();

	return (provider == "7TV" ? host.files.filter((f) => f.format === preferredFormat) : host.files)
		.slice(0, layout[provider][layout[provider].length - 1])
		.reduce(
			(pre, cur, i) =>
				pre +
				`https:${host.url}/${cur.name} ${width * layout[provider][i]}w ${height * layout[provider][i]}h, `,
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
