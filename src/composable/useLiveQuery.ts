import { liveQuery } from "dexie";
import { onUnmounted, ref, watch } from "vue";
import type { Ref } from "vue";

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

	onUnmounted(() => sub.unsubscribe());

	return value;
}

export interface LiveQueryOptions {
	count?: number;
	reactives?: Ref[];
}
