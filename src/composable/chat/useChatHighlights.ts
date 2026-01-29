import { inject, markRaw, reactive, ref, toRaw, watch } from "vue";
import { toReactive, until, useDocumentVisibility, useIntervalFn, useTitle } from "@vueuse/core";
import { debounceFn } from "@/common/Async";
import { SITE_ASSETS_URL } from "@/common/Constant";
import { log } from "@/common/Logger";
import type { ChatMessage } from "@/common/chat/ChatMessage";
import { ChannelContext } from "@/composable/channel/useChannelContext";
import { Sound, useSound } from "@/composable/useSound";
import { useConfig } from "../useSettings";

interface ChatHighlights {
	highlights: Record<string, HighlightDef>;
	// Per-context sorted caches - invalidated when highlights change
	sortedCache: HighlightDef[] | null;
	sortedPhraseCache: HighlightDef[] | null;
	sortedUsernameCache: HighlightDef[] | null;
	sortedBadgeCache: HighlightDef[] | null;
	// Version counter to force Vue reactivity on cache invalidation
	cacheVersion: number;
	// Track max priority to avoid O(n) scan on each new highlight
	currentMaxPriority: number;
}

export interface HighlightDef {
	id: string;

	pattern?: string;
	test?: (msg: ChatMessage) => boolean;
	regexp?: boolean;
	readonly cachedRegExp?: RegExp;

	color: string;
	label: string;
	caseSensitive?: boolean;
	flashTitle?: boolean;
	flashTitleFn?: (msg: ChatMessage) => string;
	soundPath?: string;
	soundDef?: Sound;
	soundFile?: {
		name: string;
		type: string;
		data: ArrayBuffer;
	};
	persist?: boolean;
	phrase?: boolean;
	username?: boolean;
	badge?: boolean;
	badgeURL?: string;
	version?: string;
	priority?: number;
}

const m = new WeakMap<ChannelContext, ChatHighlights>();

const customHighlights = useConfig<Map<string, HighlightDef>>("highlights.custom");
const soundVolume = useConfig<number>("highlights.sound_volume");

export enum HighlightCategory {
	Phrase = "phrase",
	Username = "username",
	Badge = "badge",
}

// Gets the category of a highlight based on its flags.
function getHighlightCategory(h: HighlightDef): HighlightCategory {
	if (h.username) return HighlightCategory.Username;
	if (h.badge) return HighlightCategory.Badge;
	return HighlightCategory.Phrase; // Default to phrase (includes phrase=true or no category flags)
}

export function useChatHighlights(ctx: ChannelContext) {
	const visibility = useDocumentVisibility();

	const assetsBase = inject(SITE_ASSETS_URL, "");
	const systemSounds = reactive<Record<string, Sound>>({
		ping: useSound(assetsBase + "/sound/ping.ogg"),
	});

	// Ensures a highlight has a valid priority assigned.
	// If missing or invalid, assigns currentMaxPriority + 1 so new/legacy entries land at the end.
	function ensurePriority(h: HighlightDef): void {
		if (!data) return;

		// Validate existing priority: must be a finite positive integer
		if (typeof h.priority === "number" && Number.isFinite(h.priority) && h.priority >= 1) {
			// Update max tracker if this priority is higher
			if (h.priority > data.currentMaxPriority) {
				data.currentMaxPriority = h.priority;
			}
			return;
		}

		// Assign next available priority
		data.currentMaxPriority++;
		h.priority = data.currentMaxPriority;
	}

	// Invalidates this context's sort caches
	function invalidateSortCache(): void {
		if (!data) return;
		data.sortedCache = null;
		data.sortedPhraseCache = null;
		data.sortedUsernameCache = null;
		data.sortedBadgeCache = null;
		// Increment version to trigger Vue reactivity
		data.cacheVersion++;
	}

	let data = m.get(ctx);
	if (!data) {
		// Make data reactive so Vue tracks cache invalidation
		data = reactive<ChatHighlights>({
			highlights: {},
			sortedCache: null,
			sortedPhraseCache: null,
			sortedUsernameCache: null,
			sortedBadgeCache: null,
			cacheVersion: 0,
			currentMaxPriority: 0,
		}) as ChatHighlights;

		watch(
			customHighlights,
			(h) => {
				if (!data) return;
				if (!h) return;

				// Clear all custom highlights
				for (const [k, v] of Object.entries(data.highlights)) {
					if (!v.persist) continue;

					delete data.highlights[k];
				}

				// Reset max priority before loading
				data.currentMaxPriority = 0;

				for (const [, v] of h) {
					ensurePriority(v);
					data.highlights[v.id] = v;
					updateSoundData(v);
					updateFlashTitle(v);
				}

				// Invalidate sort cache after bulk load
				invalidateSortCache();
			},
			{
				immediate: true,
			},
		);

		m.set(ctx, data);
	}

	const save = debounceFn(function (): void {
		if (!data) return;

		const items: [string, HighlightDef][] = [];
		for (const h of Object.values(data.highlights)) {
			if (!h.persist) continue;
			items.push([
				h.id,
				toRaw({
					...h,
					soundFile: toRaw(h.soundFile),
					soundDef: undefined,
					flashTitleFn: undefined,
				}),
			]);
		}

		customHighlights.value = new Map(items);
	}, 250);

	function define(id: string, def: Omit<HighlightDef, "id">, persist?: boolean): HighlightDef {
		if (!data) return {} as HighlightDef;

		const h = (data.highlights[id] = { ...def, id, persist });
		ensurePriority(h);
		updateSoundData(h);

		// Invalidate cache when adding new highlight
		invalidateSortCache();

		if (!persist) return h;

		// Store to DB
		customHighlights.value.set(id, markRaw(h));
		save();

		return h;
	}

	function updateSoundData(h: HighlightDef) {
		if (!h.soundFile) {
			if (h.soundPath?.startsWith("#") && systemSounds[h.soundPath.slice(1)]) {
				h.soundDef = systemSounds[h.soundPath.slice(1)];
			}

			return;
		}

		const blob = new Blob([h.soundFile.data], { type: h.soundFile.type });
		const url = URL.createObjectURL(blob);

		h.soundPath = url;
		h.soundDef = useSound(url);
		return url;
	}

	function updateFlashTitle(h: HighlightDef) {
		h.flashTitleFn = h.flashTitle ? () => ` 💬 Highlight: ${h.label || h.pattern}` : undefined;
	}

	function remove(id: string): void {
		if (!data) return;

		delete data.highlights[id];

		// Re-number priorities sequentially after removal to avoid gaps
		// Use fresh sort since cache will be invalidated anyway
		const remaining = Object.values(data.highlights).sort(priorityComparator);
		for (let i = 0; i < remaining.length; i++) {
			remaining[i].priority = i + 1;
		}

		// Update max priority (it's simply the count after sequential re-numbering)
		data.currentMaxPriority = remaining.length;

		// Invalidate caches
		invalidateSortCache();

		save();
	}

	function checkMatch(key: string, msg: ChatMessage): boolean {
		if (!data) return false;

		const h = data?.highlights[key];
		if (!h) return false;

		let ok = false;

		switch (getHighlightCategory(h)) {
			case HighlightCategory.Phrase:
				if (h.regexp) {
					let regexp = h.cachedRegExp;
					if (!regexp) {
						try {
							regexp = new RegExp(h.pattern as string, "i");
							Object.defineProperty(h, "cachedRegExp", { value: regexp });
						} catch (err) {
							log.warn("<ChatHighlights>", "Invalid regexp:", h.pattern ?? "");

							msg.setHighlight("#878787", "Error " + (err as Error).message);
							return false;
						}
					}

					ok = regexp.test(msg.body);
				} else if (h.pattern) {
					ok = h.caseSensitive
						? msg.body.includes(h.pattern)
						: msg.body.toLowerCase().includes(h.pattern.toLowerCase());
				} else if (typeof h.test === "function") {
					ok = h.test(msg);
				}
				break;

			case HighlightCategory.Username:
				ok = msg.author?.displayName.toLowerCase() === h.pattern?.toLowerCase();
				break;

			case HighlightCategory.Badge: {
				// Check if badge ID exists and version matches
				const badgeId = h.pattern?.toLowerCase() ?? "";
				const badgeVersion = h.version?.toLowerCase() ?? "";
				ok = badgeId in msg.badges && msg.badges[badgeId]?.toLowerCase() === badgeVersion;
				break;
			}
		}

		if (ok) {
			msg.setHighlight(h.color, h.label);

			if (h.soundDef && !msg.historical) {
				h.soundDef.play(soundVolume.value / 100);
			}

			if (h.flashTitleFn && !msg.historical) {
				setFlash(h, msg);
			}
		}

		return ok;
	}

	// Play a sound and flash the title when the actor is mentioned
	const newTitle = ref("");
	const lastKnownTitle = ref(document.title);
	let step = 0;
	const titleFlash = useIntervalFn(
		() => {
			useTitle(step++ % 2 === 0 ? newTitle.value : lastKnownTitle.value);
		},
		1000,
		{ immediate: false, immediateCallback: true },
	);

	function setFlash(def: HighlightDef, msg: ChatMessage): void {
		if (!def.flashTitleFn || titleFlash.isActive.value) return;

		lastKnownTitle.value = document.title;
		newTitle.value = def.flashTitleFn(msg);

		titleFlash.resume();

		until(visibility)
			.toBe("visible")
			.then(() => {
				titleFlash.pause();
				newTitle.value = "";
				document.title = lastKnownTitle.value;
			});
	}

	function getAll(): Record<string, HighlightDef> {
		if (!data) return {};

		return toReactive(data.highlights);
	}

	function getAllPhraseHighlights(): Record<string, HighlightDef> {
		if (!data) return {};
		// Filtering the highlights to include only those with phrase: true
		const filteredHighlights = Object.fromEntries(
			Object.entries(data.highlights).filter(
				([, highlight]) =>
					highlight.phrase === true || (!highlight.phrase && !highlight.username && !highlight.badge),
			),
		);

		return toReactive(filteredHighlights);
	}

	function getAllUsernameHighlights(): Record<string, HighlightDef> {
		if (!data) return {};
		// Filtering the highlights to include only those with username: true
		const filteredHighlights = Object.fromEntries(
			Object.entries(data.highlights).filter(([, highlight]) => highlight.username === true),
		);

		return toReactive(filteredHighlights);
	}

	function getAllBadgeHighlights(): Record<string, HighlightDef> {
		if (!data) return {};
		// Filtering the highlights to include only those with badge: true
		const filteredHighlights = Object.fromEntries(
			Object.entries(data.highlights).filter(([, highlight]) => highlight.badge === true),
		);

		return toReactive(filteredHighlights);
	}

	// Comparator for priority sorting (ascending: 1 = highest priority)
	const priorityComparator = (a: HighlightDef, b: HighlightDef): number =>
		(a.priority ?? Infinity) - (b.priority ?? Infinity);

	// Returns all highlights sorted by priority (ascending: 1 = highest priority).
	// Uses cached array - only re-sorts when highlights change.
	function getAllSorted(): HighlightDef[] {
		if (!data) return [];

		// Access cacheVersion to create reactive dependency
		void data.cacheVersion;

		if (!data.sortedCache) {
			data.sortedCache = Object.values(data.highlights).sort(priorityComparator);
		}
		return data.sortedCache;
	}

	// Returns phrase highlights sorted by priority (ascending: 1 = highest).
	// Uses cached array - only re-sorts when highlights change.
	function getAllPhraseHighlightsSorted(): HighlightDef[] {
		if (!data) return [];

		// Access cacheVersion to create reactive dependency
		void data.cacheVersion;

		if (!data.sortedPhraseCache) {
			const result: HighlightDef[] = [];
			for (const h of Object.values(data.highlights)) {
				if (h.phrase === true || (!h.phrase && !h.username && !h.badge)) {
					result.push(h);
				}
			}
			result.sort(priorityComparator);
			data.sortedPhraseCache = result;
		}
		return data.sortedPhraseCache;
	}

	// Returns username highlights sorted by priority (ascending: 1 = highest).
	// Uses cached array - only re-sorts when highlights change.
	function getAllUsernameHighlightsSorted(): HighlightDef[] {
		if (!data) return [];

		// Access cacheVersion to create reactive dependency
		void data.cacheVersion;

		if (!data.sortedUsernameCache) {
			const result: HighlightDef[] = [];
			for (const h of Object.values(data.highlights)) {
				if (h.username === true) {
					result.push(h);
				}
			}
			result.sort(priorityComparator);
			data.sortedUsernameCache = result;
		}
		return data.sortedUsernameCache;
	}

	// Returns badge highlights sorted by priority (ascending: 1 = highest).
	// Uses cached array - only re-sorts when highlights change.
	function getAllBadgeHighlightsSorted(): HighlightDef[] {
		if (!data) return [];

		// Access cacheVersion to create reactive dependency
		void data.cacheVersion;

		if (!data.sortedBadgeCache) {
			const result: HighlightDef[] = [];
			for (const h of Object.values(data.highlights)) {
				if (h.badge === true) {
					result.push(h);
				}
			}
			result.sort(priorityComparator);
			data.sortedBadgeCache = result;
		}
		return data.sortedBadgeCache;
	}

	// Sets the priority for a highlight and re-numbers other highlights to avoid duplicates.
	// Priority 1 is highest. If newPriority already exists, shifts other highlights.
	function setPriority(id: string, newPriority: number): void {
		if (!data) return;

		const highlight = data.highlights[id];
		if (!highlight) return;

		// Validate and clamp newPriority
		if (!Number.isFinite(newPriority)) return;
		newPriority = Math.max(1, Math.floor(newPriority));

		const oldPriority = highlight.priority ?? Infinity;
		if (oldPriority === newPriority) return;

		// Always use fresh sort for setPriority to ensure correct ordering
		// This is only called on user interaction, not per-message, so O(n log n) is fine
		const allHighlights = Object.values(data.highlights).sort(priorityComparator);

		// Remove the highlight from its current position
		const filtered = allHighlights.filter((h) => h.id !== id);

		// Insert at new position (newPriority - 1 because array is 0-indexed)
		const insertIndex = Math.min(newPriority - 1, filtered.length);
		filtered.splice(insertIndex, 0, highlight);

		// Re-number all priorities sequentially starting from 1
		for (let i = 0; i < filtered.length; i++) {
			filtered[i].priority = i + 1;
		}

		// Max priority is simply the count after sequential re-numbering
		data.currentMaxPriority = filtered.length;

		// Invalidate cache since priorities changed
		invalidateSortCache();

		save();
	}

	function updateId(oldId: string, newId: string): void {
		if (!data) return;

		const h = data.highlights[oldId];
		if (!h) return;

		data.highlights[newId] = h;
		delete data.highlights[oldId];

		h.id = newId;

		// Invalidate cache since the object reference in cache may be stale
		invalidateSortCache();

		save();
	}

	return {
		define,
		remove,
		getAll,
		getAllSorted,
		getAllPhraseHighlights,
		getAllUsernameHighlights,
		getAllBadgeHighlights,
		getAllPhraseHighlightsSorted,
		getAllUsernameHighlightsSorted,
		getAllBadgeHighlightsSorted,
		setPriority,
		save,
		updateId,
		checkMatch,
		updateSoundData,
		updateFlashTitle,
		getHighlightCategory,
	};
}
