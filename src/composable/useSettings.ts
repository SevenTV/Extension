import { reactive } from "vue";

const data = reactive({
	settings: {} as Record<string, string>,
});

export function useSettings() {
	function get(key: string): string | null {
		return data.settings[key] ?? null;
	}

	function set(key: string, value: string): void {
		if (data.settings[key] === value) return;

		data.settings[key] = value;
	}

	return {
		get,
		set,
	};
}
