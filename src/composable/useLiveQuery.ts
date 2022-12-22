import { liveQuery } from "dexie";
import { onUnmounted, ref, watch } from "vue";

export function useLiveQuery<T>(
	queryFn: () => T | Promise<T | undefined> | undefined,
	count?: number,
	onResult?: (result: T) => void,
) {
	const value = ref<T>();

	const handleResult = (result: T | undefined) => {
		if (!result) return;
		if (typeof count === "number" && count-- <= 0) {
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

	watch(queryFn, async () => handleResult(await queryFn()));

	onUnmounted(() => sub.unsubscribe());

	return value;
}
