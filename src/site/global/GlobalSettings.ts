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
		defaultValue: new Map(),
		transform: (v) => (String(v) !== "[object Map]" ? new Map() : (v as Map<string, number>)),
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
		effect(v) {
			document.documentElement.classList.toggle("seventv-transparent", v);
			document.body.classList.toggle("seventv-transparent", v);
		},
		defaultValue: true,
	}),
	declareConfig("chat.font-april-fools", "TOGGLE", {
		label: "Disable Comic Sans",
		hint: "Disable comic sans font in chat (an april fools joke)",
		path: ["Chat", ""],
		transform(v: unknown) {
			if (new Date() > new Date("2025-04-02")) return true;
			return v as boolean;
		},
		get defaultValue() {
			return new Date() > new Date("2025-04-02");
		},
	}),

	declareConfig("chat.font-april-fools-dismissed", "NONE", {
		label: "Disable Comic Sans",
		defaultValue: false,
		serialize: false,
	}),
	declareConfig("chat.alternating_background", "TOGGLE", {
		label: "settings.chat_alternating_background.label",
		hint: "settings.chat_alternating_background.hint",
		path: ["Chat", ""],
		defaultValue: false,
		effect(v) {
			document.documentElement.classList.toggle("seventv-alternating-chat-lines", v);
		},
	}),
	declareConfig<string>("chat.alternating_background_color", "COLOR", {
		path: ["Chat", "Style"],
		label: "Alternating Background Color",
		hint: "Configure the color of alternating background (~6% opacity)",
		disabledIf: () => !useConfig("chat.alternating_background").value,
		effect(v) {
			document.documentElement.style.setProperty("--seventv-chat-alternate-background-color", `${v}0f`);
		},
		defaultValue: "#808080",
	}),
	declareConfig("general.blur_unlisted_emotes", "TOGGLE", {
		path: ["General", ""],
		label: "Hide Unlisted Emotes",
		hint: "If checked, emotes which have not yet been approved for listing on 7tv.app will be blurred",
		defaultValue: false,
	}),
	declareConfig<number>("chat.emote_margin", "SLIDER", {
		path: ["Chat", "Style"],
		label: "Emote Spacing",
		hint: "Choose the margin around emotes in chat. Negative values lets them overlap and keep the chatlines inline. 0 Makes the emotes not overlap at all",
		options: {
			min: -1,
			max: 1,
			step: 0.1,
			unit: "rem",
		},
		defaultValue: -0.5,
		effect(v) {
			document.documentElement.style.setProperty("--seventv-emote-margin", `${v}rem`);
		},
	}),
	declareConfig<number>("chat.emote_scale", "SLIDER", {
		path: ["Chat", "Style"],
		label: "Emote Scale",
		ffz_key: "chat.emotes.2x",
		ffz_transform(v: unknown) {
			return typeof v === "number" && v > 0 ? 2 : 1;
		},
		hint: "Change how large emotes should be in chat, as a multiple of their original size.",
		options: {
			min: 0.25,
			max: 3,
			step: 0.25,
			unit: "x",
		},
		defaultValue: 1,
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
	declareConfig<number>("vanity.paints_drop_shadows", "DROPDOWN", {
		path: ["Appearance", "Vanity"],
		label: "Drop shadows on paints",
		options: [
			["None", 0],
			["One", 2],
			["All", 1],
		],
		hint: "Wheather or not to display drop shadows on paints (Requires a refresh)",
		disabledIf: () => !useConfig("vanity.nametag_paints").value,
		defaultValue: 1,
	}),
];
