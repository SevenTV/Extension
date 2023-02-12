import { InjectionKey, Ref } from "vue";

export const LOCAL_STORAGE_KEYS = {
	WORKER_ADDR: "seventv_worker_addr",
};

export const REACT_TYPEOF_TOKEN = "$$typeof";

export const SITE_NAV_PATHNAME: InjectionKey<Ref<string>> = Symbol("seventv-site-nav-pathname");
