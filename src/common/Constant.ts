import { InjectionKey, Ref } from "vue";

export const LOCAL_STORAGE_KEYS = {
	WORKER_ADDR: "seventv_worker_addr",
};

export const REACT_TYPEOF_TOKEN = "$$typeof";

export const SITE_NAV_PATHNAME: InjectionKey<Ref<string>> = Symbol("seventv-site-nav-pathname");

export const UNICODE_TAG_0 = "\u{E0000}";
export const UNICODE_TAG_0_REGEX = new RegExp(UNICODE_TAG_0, "g");
