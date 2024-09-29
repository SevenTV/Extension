import { reactive } from "vue";
import type { ChannelContext } from "@/composable/channel/useChannelContext";
import { useEmoji } from "@/composable/useEmoji";

interface ChatEmotes {
	active: Record<string, SevenTV.ActiveEmote>;
	sets: Record<string, SevenTV.EmoteSet>;
	emojis: Record<string, SevenTV.ActiveEmote>;
	providers: Record<SevenTV.Provider, Record<string, SevenTV.EmoteSet>>;
}

const m = new WeakMap<ChannelContext, ChatEmotes>();
const emojiSets = {} as Record<string, SevenTV.EmoteSet>;
const emojis = {} as Record<string, SevenTV.ActiveEmote>;

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
				PLATFORM: reactive({}),
				EMOJI: reactive(emojiSets),
			},
		});

		m.set(ctx, x);
	}

	function reset() {
		if (!x) return;

		for (const k in x.providers) {
			if (k === "EMOJI") continue;

			for (const k2 in x.providers[k as SevenTV.Provider]) {
				delete x.providers[k as SevenTV.Provider][k2];
			}
		}

		for (const k in x.active) {
			const ae = x.active[k];
			if (ae.provider === "EMOJI") continue;
			delete x.active[k];
		}
	}

	function byProvider(provider: SevenTV.Provider) {
		if (!x) return {};

		return x.providers[provider];
	}

	function find(f: (ae: SevenTV.ActiveEmote) => boolean, activeOnly = false): SevenTV.ActiveEmote | null {
		if (!x) return null;

		if (activeOnly) {
			for (const ae of Object.values(x.active)) {
				if (f(ae)) return ae;
			}
		} else {
			for (const provider of Object.values(x.providers)) {
				for (const set of Object.values(provider)) {
					for (const emote of Object.values(set.emotes)) {
						if (f(emote)) return emote;
					}
				}
			}
		}

		return null;
	}

	const r = reactive({
		active: x.active,
		sets: x.sets,
		emojis: x.emojis,
		providers: x.providers,
		reset,
		byProvider,
		find,
	});

	return r;
}

export function convertEmojis(): void {
	const { emojiList } = useEmoji();
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
}
