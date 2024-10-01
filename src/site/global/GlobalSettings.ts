import { declareConfig, useConfig } from "@/composable/useSettings";

export const dataSettings = [
	declareConfig("app.version", "NONE", {
		label: "App Version",
		defaultValue: void 0 as never,
	}),
	declareConfig("app.7tv.token", "NONE", {
		label: "7TV Bearer Token",
		defaultValue: "",
		serialize: false,
	}),
	declareConfig("ui.emote_menu.favorites", "NONE", {
		label: "Emote menu favourites",
		defaultValue: new Set(),
	}),
	declareConfig("ui.emote_menu.usage", "NONE", {
		label: "Emote menu usage",
		defaultValue: new Set(),
		serialize: false,
	}),
	declareConfig("ui.emote_menu.collapsed_sets", "NONE", {
		label: "Emote menu collapsed sets",
		defaultValue: new Set(),
		serialize: false,
	}),
];

export const globalSettings = [
	declareConfig("ui.transparent_backgrounds", "TOGGLE", {
		path: ["Appearance", "Interface"],
		label: "Use UI transparency",
		hint: "If checked some backgrounds will be transparent and blurred. This may affect performance",
		defaultValue: true,
	}),
	declareConfig("ui.emote_menu.default_tab", "DROPDOWN", {
		path: ["Appearance", "Interface"],
		label: "Emote Menu: Default Emote Tab",
		hint: "Select default tab when opening emote menu",
		options: [
			["Favorite", "FAVORITE"],
			["7TV", "7TV"],
			["FFZ", "FFZ"],
			["BTTV", "BTTV"],
			["Platform", "PLATFORM"],
			["Emoji", "EMOJI"],
		],
		defaultValue: "7TV",
	}),
	declareConfig<boolean>("ui.emote_menu.most_used", "TOGGLE", {
		path: ["Appearance", "Interface"],
		label: "Emote Menu: Most Used Emotes",
		hint: "Whether or not to display the emotes you type the most in the emote menu (Temporarily disabled due to performance issues)",
		disabledIf: () => true,
		defaultValue: true,
	}),
	declareConfig<boolean>("vanity.nametag_paints", "TOGGLE", {
		path: ["Appearance", "Vanity"],
		label: "Nametag Paints",
		hint: "Whether or not to display nametag paints",
		defaultValue: true,
	}),
	declareConfig<boolean>("vanity.7tv_Badges", "TOGGLE", {
		path: ["Appearance", "Vanity"],
		label: "7TV Badges",
		hint: "Whether or not to display 7TV Badges",
		defaultValue: true,
	}),
	declareConfig<boolean>("vanity.paints_drop_shadows", "TOGGLE", {
		path: ["Appearance", "Vanity"],
		label: "Drop shadows on paints",
		hint: "Wheather or not to display drop shadows on paints (Requires a refresh)",
		disabledIf: () => !useConfig("vanity.nametag_paints").value,
		defaultValue: true,
	}),
];
