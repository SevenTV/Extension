import { useChatAPI } from "@/site/twitch.tv/ChatAPI";

const { imageFormat } = useChatAPI();

export function imageHostToSrcset(host: SevenTV.ImageHost, imageF: SevenTV.ImageFormat = imageFormat.value): string {
	const format = host.files.some((fi) => fi.format === imageF) ? imageF : host.files[0]?.format;
	return host.files
		.filter((f) => f.format === format)
		.map((f, i) => `https:${host.url}/${f.name} ${isNaN(Number(f.name.at(0))) ? i : f.name.at(0)}x`)
		.join(", ");
}

export function imageHostToSrcsetWithsize(height: number, width: number, host: SevenTV.ImageHost): string {
	const format = host.files.some((fi) => fi.format === imageFormat.value) ? imageFormat.value : host.files[0]?.format;
	return host.files
		.filter((f) => f.format === format)
		.map((f, i) => {
			const fileName = isNaN(Number(f.name.at(0))) ? i : parseInt(f.name.at(0)!);

			return `https:${host.url}/${f.name} ${width * fileName}w ${height * fileName}h`;
		})
		.join(", ");
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
