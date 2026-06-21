import { computed } from "vue";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useConfig } from "@/composable/useSettings";

export function useEmoteBlacklist() {
	const ctx = useChannelContext();
	const map = useConfig<Record<string, string[]>>("chat.emote_blacklist_per_channel");

	const key = computed(() => (ctx.username || ctx.id || "").toLowerCase());

	const list = computed<string[]>(() => map.value?.[key.value] ?? []);

	function isHidden(name: string) {
		return list.value.includes(name);
	}

	function toggle(name: string) {
		const current = { ...(map.value ?? {}) };
		const arr = new Set(current[key.value] ?? []);
		if (arr.has(name)) arr.delete(name);
		else arr.add(name);
		current[key.value] = [...arr];
		map.value = current;
	}

	return { list, isHidden, toggle };
}
