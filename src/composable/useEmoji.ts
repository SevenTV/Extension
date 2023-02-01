import { reactive } from "vue";
import emojiList from "@/assets/blob/emoji.json";

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

for (const e of emojiList) {
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

export const useEmoji = () => {
	return reactive({
		emojiList: emojiList as Emoji[],
		emojiByCode,
		emojiByName,
	});
};
