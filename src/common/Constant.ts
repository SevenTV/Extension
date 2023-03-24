import type { InjectionKey, Ref } from "vue";

export const APP_BROADCAST_CHANNEL = "seventv-app-broadcast-channel";

export const LOCAL_STORAGE_KEYS = {
	WORKER_ADDR: "seventv_worker_addr",
	SEEN_SETTINGS: "seventv_seen_settings",
};

export const REACT_TYPEOF_TOKEN = "$$typeof";

export const SITE_CURRENT_PLATFORM: InjectionKey<Platform> = Symbol("seventv-site-current-platform");
export const SITE_NAV_PATHNAME: InjectionKey<Ref<string>> = Symbol("seventv-site-nav-pathname");
export const SITE_WORKER_URL: InjectionKey<string> = Symbol("seventv-site-worker-url");
export const SITE_ASSETS_URL: InjectionKey<string> = Symbol("seventv-site-assets-url");
export const SITE_EXT_OPTIONS_URL: InjectionKey<string> = Symbol("seventv-site-ext-options-url");

export const UNICODE_TAG_0 = "\u{E0000}";
export const UNICODE_TAG_0_REGEX = new RegExp(UNICODE_TAG_0, "g");
