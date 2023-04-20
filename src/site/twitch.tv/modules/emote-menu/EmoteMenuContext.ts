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

export type SortPropertyKey = "name" | "listed" | "animated" | "timestamp";

const SortPropertyKeyValues: Record<SortPropertyKey, string> = {
	name: "Name",
	listed: "Listed",
	animated: "Animated",
	timestamp: "Date added"
}

const options: [string, SevenTV.SettingType][] = Object.entries(SortPropertyKeyValues).map(([k, v]) => [v, k])

export const emoteMenuSortProperties: SevenTV.SettingNode<SevenTV.SettingType, "DROPDOWN"> = {
	key: "ui.emote_menu.sort_by",
	label: "Sort by",
	type: "DROPDOWN",
	defaultValue: "timestamp",
	options
};
