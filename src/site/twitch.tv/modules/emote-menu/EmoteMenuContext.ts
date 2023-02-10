import { inject, provide, reactive } from "vue";

export const EMOTE_MENU_CTX = Symbol("seventv-emote-menu-context");

interface EmoteMenuContext {
	filter: string;
	channelID: string;
}

export function useEmoteMenuContext(): EmoteMenuContext {
	let data = inject<EmoteMenuContext | null>(EMOTE_MENU_CTX, null);
	if (!data) {
		data = reactive<EmoteMenuContext>({
			filter: "",
			channelID: "",
		});

		provide(EMOTE_MENU_CTX, data);
	}

	return data;
}
