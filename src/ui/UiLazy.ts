import { onUnmounted, reactive } from "vue";

const instances = reactive<Map<symbol | string, number>>(new Map());

export function useUiLazy(id: symbol | string) {
	function increment(incr = 1) {
		if (!instances.has(id)) {
			instances.set(id, 0);
		} else {
			instances.set(id, instances.get(id)! + incr);
		}

		return instances.get(id)!;
	}

	onUnmounted(() => instances.delete(id));

	return {
		increment,
	};
}
