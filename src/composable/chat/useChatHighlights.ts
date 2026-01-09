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

/**
 * Gets the category of a highlight based on its flags.
 */
function getHighlightCategory(h: HighlightDef): "phrase" | "username" | "badge" {
	if (h.username) return "username";
	if (h.badge) return "badge";
	return "phrase"; // Default to phrase (includes phrase=true or no category flags)
}

export function useChatHighlights(ctx: ChannelContext) {
	const visibility = useDocumentVisibility();

	const assetsBase = inject(SITE_ASSETS_URL, "");
	const systemSounds = reactive<Record<string, Sound>>({
		ping: useSound(assetsBase + "/sound/ping.ogg"),
	});

	let data = m.get(ctx);
	if (!data) {
		data = reactive<ChatHighlights>({
			highlights: {},
		});

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

				for (const [, v] of h) {
					ensurePriority(v, data);
					data.highlights[v.id] = v;
					updateSoundData(v);
					updateFlashTitle(v);
				}
			},
			{
				immediate: true,
			},
		);

		m.set(ctx, data);
	}

	/**
	 * Ensures a highlight has a priority assigned.
	 * If missing, assigns maxPriority + 1 so new/legacy entries land at the end of ordering.
	 */
	function ensurePriority(h: HighlightDef, dataRef: ChatHighlights): void {
		if (typeof h.priority === "number") return;

		const existing = Object.values(dataRef.highlights);
		const maxPriority = existing.length ? Math.max(...existing.map((x) => x.priority ?? 0)) : 0;
		h.priority = maxPriority + 1;
	}

	const save = debounceFn(function (): void {
		if (!data) return;

		const items: [string, HighlightDef][] = Array.from(Object.values(data.highlights))
			.filter((h) => h.persist)
			.map((h) => [
				h.id,
				toRaw({
					...h,
					soundFile: toRaw(h.soundFile),
					soundDef: undefined,
					flashTitleFn: undefined,
				}),
			]);

		customHighlights.value = new Map(items);
	}, 250);

	function define(id: string, def: Omit<HighlightDef, "id">, persist?: boolean): HighlightDef {
		if (!data) return {} as HighlightDef;

		const h = (data.highlights[id] = { ...def, id, persist });
		ensurePriority(h, data);
		updateSoundData(h);

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

		// Re-number priorities sequentially after removal
		const remaining = Object.values(data.highlights).sort(
			(a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity),
		);
		remaining.forEach((h, index) => {
			h.priority = index + 1;
		});

		save();
	}

	function checkMatch(key: string, msg: ChatMessage): boolean {
		if (!data) return false;

		const h = data?.highlights[key];
		if (!h) return false;

		let ok = false;

		if (h.phrase || (!h.phrase && !h.username && !h.badge)) {
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
		} else if (h.username) {
			ok = msg.author?.displayName.toLowerCase() === h.pattern?.toLowerCase();
		} else if (h.badge) {
			ok =
				Object.keys(msg.badges).indexOf(h.pattern?.toLowerCase() ?? "") > -1 &&
				Object.values(msg.badges).indexOf(h.version?.toLowerCase() ?? "") > -1;
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

	/**
	 * Returns all highlights sorted by priority (ascending: 1 = highest priority).
	 * Used by the matching loop to determine which highlight applies first.
	 */
	function getAllSorted(): HighlightDef[] {
		if (!data) return [];

		return Object.values(data.highlights)
			.slice()
			.sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity));
	}

	/**
	 * Returns phrase highlights sorted by priority (ascending: 1 = highest).
	 */
	function getAllPhraseHighlightsSorted(): HighlightDef[] {
		if (!data) return [];

		return Object.values(data.highlights)
			.filter((h) => h.phrase === true || (!h.phrase && !h.username && !h.badge))
			.sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity));
	}

	/**
	 * Returns username highlights sorted by priority (ascending: 1 = highest).
	 */
	function getAllUsernameHighlightsSorted(): HighlightDef[] {
		if (!data) return [];

		return Object.values(data.highlights)
			.filter((h) => h.username === true)
			.sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity));
	}

	/**
	 * Returns badge highlights sorted by priority (ascending: 1 = highest).
	 */
	function getAllBadgeHighlightsSorted(): HighlightDef[] {
		if (!data) return [];

		return Object.values(data.highlights)
			.filter((h) => h.badge === true)
			.sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity));
	}

	/**
	 * Sets the priority for a highlight and re-numbers other highlights to avoid duplicates.
	 * Priority 1 is highest. If newPriority already exists, shifts other highlights down.
	 */
	function setPriority(id: string, newPriority: number): void {
		if (!data) return;

		const highlight = data.highlights[id];
		if (!highlight) return;

		// Ensure newPriority is at least 1
		newPriority = Math.max(1, Math.floor(newPriority));

		const oldPriority = highlight.priority ?? Infinity;
		if (oldPriority === newPriority) return;

		// Get all highlights sorted by current priority
		const allHighlights = Object.values(data.highlights).sort(
			(a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity),
		);

		// Remove the highlight from its current position
		const filtered = allHighlights.filter((h) => h.id !== id);

		// Insert at new position (newPriority - 1 because array is 0-indexed)
		const insertIndex = Math.min(newPriority - 1, filtered.length);
		filtered.splice(insertIndex, 0, highlight);

		// Re-number all priorities sequentially starting from 1
		filtered.forEach((h, index) => {
			h.priority = index + 1;
		});

		save();
	}

	function updateId(oldId: string, newId: string): void {
		if (!data) return;

		const h = data.highlights[oldId];
		if (!h) return;

		data.highlights[newId] = h;
		delete data.highlights[oldId];

		h.id = newId;

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
