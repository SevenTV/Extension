import { ref, watch } from "vue";
import { MaybeRef, tryOnUnmounted } from "@vueuse/core";
import { liveQuery } from "dexie";

export function useLiveQuery<T>(
	queryFn: () => T | Promise<T | undefined> | undefined,
	onResult?: (result: T) => void,
	opt: LiveQueryOptions = {},
) {
	const value = ref<T>();

	let queryStop = () => {};
	let watchStop = () => {};
	const stop = () => {
		queryStop();
		watchStop();
	};

	const handleResult = (result: T | undefined) => {
		if (!result) return;
		if (typeof opt.count === "number" && opt.count-- <= 0) {
			stop();
		}

		value.value = result;
		onResult?.(result);
	};

	queryStop = liveQuery(queryFn).subscribe(handleResult).unsubscribe;

	if (opt.reactives) {
		watchStop = watch(opt.reactives, () => {
			queryStop();
			queryStop = liveQuery(queryFn).subscribe(handleResult).unsubscribe;
		});
	}

	tryOnUnmounted(stop);

	opt.until?.then(stop);

	return value;
}

export interface LiveQueryOptions {
	count?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	reactives?: MaybeRef<any>[];
	until?: Promise<boolean>;
}
