import { reactive } from "vue";
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

interface ChatEmotes {
	active: Record<string, SevenTV.ActiveEmote>;
	sets: Record<string, SevenTV.EmoteSet>;
	emojis: Record<string, SevenTV.ActiveEmote>;
	providers: Record<SevenTV.Provider, Record<string, SevenTV.EmoteSet>>;
}

const m = new WeakMap<ChannelContext, ChatEmotes>();

export function useChatEmotes(ctx: ChannelContext) {
	let x = m.get(ctx);
	if (!x) {
		x = reactive<ChatEmotes>({
			active: reactive({}),
			sets: reactive({}),
			emojis: reactive(emojis),
			providers: {
				"7TV": reactive({}),
				FFZ: reactive({}),
				BTTV: reactive({}),
				TWITCH: reactive({}),
				EMOJI: reactive(emojiSets),
			},
		});

		m.set(ctx, x);
	}

	function resetProviders() {
		if (!x) return;

		for (const k in x.providers) {
			if (k === "EMOJI") continue;

			for (const k2 in x.providers[k as SevenTV.Provider]) {
				delete x.providers[k as SevenTV.Provider][k2];
			}
		}
	}

	function byProvider(provider: SevenTV.Provider) {
		if (!x) return {};

		return x.providers[provider];
	}

	const r = reactive({
		active: x.active,
		sets: x.sets,
		emojis: x.emojis,
		providers: x.providers,
		resetProviders,
		byProvider,
	});

	return r;
}
