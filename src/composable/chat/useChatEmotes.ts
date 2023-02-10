import { reactive, toRef } from "vue";
import type { ChannelContext } from "@/composable/channel/useChannelContext";
import { useEmoji } from "@/composable/useEmoji";

const { emojiList } = useEmoji();
const emojiSets = {} as Record<string, SevenTV.EmoteSet>;
const emojis = {} as Record<string, SevenTV.ActiveEmote>;
emojiList.forEach((e) => {
	const es = emojiSets[e.group];
	if (!es) {
		emojiSets[e.group] = {
			id: e.group,
			name: e.group,
			provider: "EMOJI",
			emotes: [],
			tags: [],
			immutable: true,
			privileged: true,
			flags: 0,
		};
	}

	emojiSets[e.group].emotes.push(e.emote);
	emojis[e.emote.name] = e.emote;
});

class ChatEmotes {
	active: Record<string, SevenTV.ActiveEmote> = {};
	sets: Record<string, SevenTV.EmoteSet> = {};
	emojis: Record<string, SevenTV.ActiveEmote> = emojis;
	providers: Record<SevenTV.Provider, Record<string, SevenTV.EmoteSet>> = {
		"7TV": {},
		FFZ: {},
		BTTV: {},
		TWITCH: {},
		EMOJI: emojiSets,
	};

	resetProviders(): void {
		this.providers = {
			"7TV": {},
			FFZ: {},
			BTTV: {},
			TWITCH: {},
			EMOJI: emojiSets,
		};
	}

	byProvider(provider: SevenTV.Provider) {
		return toRef(this.providers, provider);
	}
}

const m = new WeakMap<ChannelContext, ChatEmotes>();

export function useChatEmotes(ctx: ChannelContext) {
	let x = m.get(ctx);
	if (!x) {
		x = reactive(new ChatEmotes());

		m.set(ctx, x);
	}

	return x;
}
