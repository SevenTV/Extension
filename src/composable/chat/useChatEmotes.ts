import { reactive, toRef } from "vue";

const data = reactive({
	// Emote Data
	active: {} as Record<string, SevenTV.ActiveEmote>,
	providers: {
		"7TV": {},
		FFZ: {},
		BTTV: {},
		TWITCH: {},
	} as Record<SevenTV.Provider, Record<string, SevenTV.EmoteSet>>,
});

export function resetProviders() {
	data.providers = {
		"7TV": {},
		FFZ: {},
		BTTV: {},
		TWITCH: {},
	} as Record<SevenTV.Provider, Record<string, SevenTV.EmoteSet>>;
}

function byProvider(provider: SevenTV.Provider) {
	return toRef(data.providers, provider);
}

export function useChatEmotes() {
	return reactive({
		active: toRef(data, "active"),
		providers: toRef(data, "providers"),
		byProvider,
	});
}
