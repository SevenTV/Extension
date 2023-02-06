import { inject, provide, reactive } from "vue";

export const EMOTE_MENU_CTX = Symbol("seventv-emote-menu-context");

interface EmoteMenuContext {
	filter: string;
}

export function useEmoteMenuContext(): EmoteMenuContext {
	let data = inject<EmoteMenuContext>(EMOTE_MENU_CTX);
	if (!data) {
		data = reactive<EmoteMenuContext>({
			filter: "",
		});

		provide(EMOTE_MENU_CTX, data);
	}

	return data;
}
