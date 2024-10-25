import type { InjectionKey, Ref } from "vue";

export const APP_BROADCAST_CHANNEL = "seventv-app-broadcast-channel";

export const LOCAL_STORAGE_KEYS = {
	WORKER_ADDR: "seventv_worker_addr",
	SEEN_SETTINGS: "seventv_seen_settings",
	APP_TOKEN: "seventv_app_token",
};

export const REACT_TYPEOF_TOKEN = "$$typeof";

export const SITE_CURRENT_PLATFORM: InjectionKey<Platform> = Symbol("seventv-site-current-platform");
export const SITE_NAV_PATHNAME: InjectionKey<Ref<string>> = Symbol("seventv-site-nav-pathname");
export const SITE_WORKER_URL: InjectionKey<string> = Symbol("seventv-site-worker-url");
export const SITE_ASSETS_URL: InjectionKey<string> = Symbol("seventv-site-assets-url");
export const SITE_EXT_OPTIONS_URL: InjectionKey<string> = Symbol("seventv-site-ext-options-url");
export const SITE_ACTIVE_WINDOW: InjectionKey<Window> = Symbol("seventv-site-active-window");

export const UNICODE_TAG_0 = "\u{E0000}";
export const UNICODE_TAG_0_REGEX = new RegExp(UNICODE_TAG_0, "g");

export const TWITCH_PROFILE_IMAGE_REGEX = /(\d+x\d+)(?=\.\w{3,4}$)/;

export const HOSTNAME_SUPPORTED_REGEXP = /([a-z0-9]+[.])*(youtube|kick)[.]com/;
export const SEVENTV_EMOTE_LINK = new RegExp(
	"https?:\\/\\/(?:www\\.)?7tv.app\\/emotes\\/(?<emoteID>[0-7][0-9A-HJKMNP-TV-Z]{25})",
	"i",
);
export const SEVENTV_EMOTE_ID = new RegExp("[0-9a-f]{24}");
export const SEVENTV_EMOTE_NAME_REGEXP = new RegExp("^[-_A-Za-z():0-9]{2,100}$");
