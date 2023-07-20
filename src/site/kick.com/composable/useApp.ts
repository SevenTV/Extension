import { App, InjectionKey, inject } from "vue";

const KICK_APP_KEY: InjectionKey<App<Element>> = Symbol("KICK_APP_KEY");

export function useApp() {
	let app = inject(KICK_APP_KEY, null);
	if (!app) {
		app = (document.querySelector("#app") as unknown as Record<string, never>)?.__vue_app__ as App<Element>;
		if (!app) throw new Error("Could not acquire vue app");

		inject(KICK_APP_KEY, app);
	}

	return app;
}
