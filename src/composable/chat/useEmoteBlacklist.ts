import { computed } from "vue";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useConfig } from "@/composable/useSettings";

/**
 * Shared per-channel emote blacklist state.
 *
 * The blacklist is stored as a single `Record<channelKey, emoteName[]>` config value
 * (see "chat.emote_blacklist_per_channel" in GlobalSettings.ts) so every platform
 * (Twitch, Kick, YouTube) MUST use this same key derivation and data shape -
 * do not read/write the config directly elsewhere.
 */

export function useEmoteBlacklist() {
	const ctx = useChannelContext();
	const map = useConfig<Record<string, string[]>>("chat.emote_blacklist_per_channel");
	const enabled = useConfig<boolean>("chat.emote_blacklist_per_channel.enabled");

	const key = computed(() => (ctx.username || ctx.id || "").toLowerCase());

	const list = computed<string[]>(() => map.value?.[key.value] ?? []);

	// The set of emote names that should actually be rendered as plain text right now.
	// Empty when the master toggle is off, even if the user has blacklisted entries saved,
	// so turning the feature off immediately restores every hidden emote.
	const hiddenEmotes = computed<Set<string>>(() => (enabled.value ? new Set(list.value) : new Set()));

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

	return { list, isHidden, toggle, hiddenEmotes, enabled };
}
