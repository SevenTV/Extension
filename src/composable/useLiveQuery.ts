import { ref, watch } from "vue";
import { MaybeRef, tryOnUnmounted } from "@vueuse/core";
import { liveQuery } from "dexie";

export function useLiveQuery<T>(
	queryFn: () => T | Promise<T | undefined> | undefined,
	onResult?: (result: T) => void,
	opt: LiveQueryOptions = {},
) {
	const value = ref<T>();

	if (opt.reactives) {
		opt.reactives.forEach((r) => watch(r, async () => handleResult(await queryFn()), { deep: true }));
		watch(queryFn, async () => handleResult(await queryFn()));
	}

	const handleResult = (result: T | undefined) => {
		if (!result) return;
		if (typeof opt.count === "number" && opt.count-- <= 0) {
			sub.unsubscribe();
		}

		value.value = result;
		onResult?.(result);
	};

	const observable = liveQuery(queryFn);
	const sub = observable.subscribe({
		next(x) {
			handleResult(x);
		},
	});

	tryOnUnmounted(() => sub.unsubscribe());

	if (opt.until) {
		opt.until.then(() => sub.unsubscribe());
	}

	return value;
}

export interface LiveQueryOptions {
	count?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	reactives?: MaybeRef<any>[];
	until?: Promise<boolean>;
}
