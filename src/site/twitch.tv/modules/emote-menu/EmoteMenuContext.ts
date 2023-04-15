import { inject, provide, reactive } from "vue";

export const EMOTE_MENU_CTX = Symbol("seventv-emote-menu-context");

interface EmoteMenuContext {
	open: boolean;
	filter: string;
	channelID: string;
}

export function useEmoteMenuContext(): EmoteMenuContext {
	let data = inject<EmoteMenuContext | null>(EMOTE_MENU_CTX, null);
	if (!data) {
		data = reactive<EmoteMenuContext>({
			open: false,
			filter: "",
			channelID: "",
		});

		provide(EMOTE_MENU_CTX, data);
	}

	return data;
}

export type EmoteMenuSortPropertyKey = "Name" | "Listed" | "Animated" | "Timestamp";

type EmoteMenuSort = {
	[key in EmoteMenuSortPropertyKey]: string;
};

export const emoteMenuSortProperties: EmoteMenuSort = {
	Name: "Name",
	Listed: "Listed",
	Animated: "Animated",
	Timestamp: "Date added",
};
