import { App, Ref, reactive } from "vue";
import type { RouteLocationNormalizedLoaded } from "vue-router";
import { definePropertyHook } from "@/common/Reflection";

interface KickRouter {
	currentRoute: RouteLocationNormalizedLoaded | null;
}

const m = new WeakMap<App<Element>, KickRouter>();

export function useRouter(app: App<Element>) {
	let router = m.get(app) as KickRouter;
	if (!router) {
		const inst = app.config.globalProperties.$router;
		if (!inst) throw new Error("Could not acquire vue router");

		router = reactive<KickRouter>({
			currentRoute: null,
		});

		definePropertyHook(inst.currentRoute as Ref<RouteLocationNormalizedLoaded> & Record<string, never>, "_value", {
			value(v) {
				router.currentRoute = v;
			},
		});
	}

	return router;
}
