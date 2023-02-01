import { reactive, toRef } from "vue";
import { Emoji, useEmoji } from "../useEmoji";

const { emojiList } = useEmoji();

const data = reactive({
	// Emote Data
	active: {} as Record<string, SevenTV.ActiveEmote>,
	sets: {} as Record<string, SevenTV.EmoteSet>,
	emojis: {} as Record<string, SevenTV.ActiveEmote>,
	providers: {
		"7TV": {},
		FFZ: {},
		BTTV: {},
		TWITCH: {},
		EMOJI: {},
	} as Record<SevenTV.Provider, Record<string, SevenTV.EmoteSet>>,
});

export function resetProviders() {
	data.providers = {
		"7TV": {},
		FFZ: {},
		BTTV: {},
		TWITCH: {},
		EMOJI: data.providers.EMOJI,
	} as Record<SevenTV.Provider, Record<string, SevenTV.EmoteSet>>;
}

function byProvider(provider: SevenTV.Provider) {
	return toRef(data.providers, provider);
}

function populateEmoji(emoji: Emoji): void {
	const es = data.providers["EMOJI"][emoji.group];
	if (!es) {
		data.providers["EMOJI"][emoji.group] = {
			id: emoji.group,
			name: emoji.group,
			provider: "EMOJI",
			emotes: [],
			tags: [],
			immutable: true,
			privileged: true,
			flags: 0,
		};
	}

	data.providers["EMOJI"][emoji.group].emotes.push(emoji.emote);
	data.emojis[emoji.emote.name] = emoji.emote;
}

emojiList.forEach((e) => populateEmoji(e));

export function useChatEmotes() {
	return reactive({
		active: toRef(data, "active"),
		sets: toRef(data, "sets"),
		providers: toRef(data, "providers"),
		emojis: toRef(data, "emojis"),
		byProvider,
	});
}
