import { ref, watch } from "vue";
import { MaybeRef, tryOnUnmounted } from "@vueuse/core";
import { liveQuery } from "dexie";

export function useLiveQuery<T>(
	queryFn: () => T | Promise<T | undefined> | undefined,
	onResult?: (result: T) => void,
	opt: LiveQueryOptions = {},
) {
	const value = ref<T>();

	const handleResult = (result: T | undefined) => {
		if (!result) return;
		if (typeof opt.count === "number" && opt.count-- <= 0) {
			sub.unsubscribe();
		}

		value.value = result;
		onResult?.(result);
	};

	let observable = liveQuery(queryFn);
	let sub = observable.subscribe({
		next(x) {
			handleResult(x);
		},
	});

	const reset = () => {
		sub.unsubscribe();
		observable = liveQuery(queryFn);
		sub = observable.subscribe({
			next(x) {
				handleResult(x);
			},
		});
	};

	if (opt.reactives) {
		watch(opt.reactives, reset);
	}

	tryOnUnmounted(sub.unsubscribe);

	opt.until?.then(sub.unsubscribe);

	return value;
}

export interface LiveQueryOptions {
	count?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	reactives?: MaybeRef<any>[];
	until?: Promise<boolean>;
}
