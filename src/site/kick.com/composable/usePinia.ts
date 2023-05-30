import { App } from "vue";
import { Pinia, StateTree, _StoreWithState } from "pinia";

export function usePinia<T extends StateTree>(app: App<Element>, key: string) {
	const pinia = app.config.globalProperties.$pinia;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const stores = (pinia as Pinia & { _s: Map<string, _StoreWithState<"ANY-KICK-STORE", T, unknown, unknown>> })["_s"];

	return stores.get(key) as _StoreWithState<"ANY-KICK-STORE", T, unknown, unknown> | undefined;
}
