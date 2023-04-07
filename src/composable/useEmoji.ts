import { inject, reactive } from "vue";
import { SITE_ASSETS_URL } from "@/common/Constant";

export interface Emoji {
	codes: string;
	char: string;
	name: string;
	category: string;
	group: string;
	subgroup: string;
	emote: SevenTV.ActiveEmote;
}

const emojiByName = new Map<string, Emoji>();
const emojiByCode = new Map<string, Emoji>();

const cached = [] as Emoji[];
export async function loadEmojiList() {
	if (cached.length) return cached;

	const assetsBase = inject(SITE_ASSETS_URL, "");
	const data = (await (await fetch(assetsBase + "/emoji/emoji.json")).json().catch(() => void 0)) as Emoji[];

	for (const e of data) {
		const emoji = e as Emoji;

		emoji.emote = {
			id: emoji.codes,
			name: emoji.name,
			unicode: emoji.char,
			provider: "EMOJI",
			flags: 0,
		} as SevenTV.ActiveEmote;

		emojiByName.set(emoji.name, emoji);
		emojiByCode.set(emoji.char, emoji);
	}

	cached.push(...data);
}

export function useEmoji() {
	return reactive({
		emojiList: cached,
		emojiByCode,
		emojiByName,
	});
}
