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
	channelID: string;
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
}

const m = new WeakMap<ChannelContext, ChatHighlights>();

const customHighlights = useConfig<Map<string, HighlightDef>>("highlights.custom");
const soundVolume = useConfig<number>("highlights.sound_volume");

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

				// Clear all custom highlights
				for (const [k, v] of Object.entries(data.highlights)) {
					if (!v.persist) continue;

					delete data.highlights[k];
				}

				for (const [, v] of h) {
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
		save();
	}

	function checkMatch(key: string, msg: ChatMessage): boolean {
		if (!data) return false;

		const h = data?.highlights[key];
		if (!h) return false;
		console.log(h.channelID, msg.channelID)
		console.log(h.channelID, h.channelID != msg.channelID)
		if(h.channelID && h.channelID != msg.channelID) return false;

		let ok = false;

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
		save,
		updateId,
		checkMatch,
		updateSoundData,
		updateFlashTitle,
	};
}
