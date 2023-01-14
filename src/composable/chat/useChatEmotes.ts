import { reactive, toRefs } from "vue";

const data = reactive({
	// Emote Data
	emoteMap: {} as Record<string, SevenTV.ActiveEmote>,
	emoteProviders: {} as Record<SevenTV.Provider, Record<string, SevenTV.EmoteSet>>,
});

function resetProviders() {
	data.emoteProviders = {} as Record<SevenTV.Provider, Record<string, SevenTV.EmoteSet>>;
}

export function useChatEmotes() {
	const { emoteMap, emoteProviders } = toRefs(data);

	return {
		emoteMap,
		emoteProviders,

		resetProviders,
	};
}
