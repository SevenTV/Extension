import { CustomRefFactory, inject, markRaw, reactive, ref, toRaw, watch } from "vue";
import { IgnoredUpdater, toReactive, until, useDocumentVisibility, useIntervalFn, useTitle } from "@vueuse/core";
import { debounceFn } from "@/common/Async";
import { SITE_ASSETS_URL } from "@/common/Constant";
import { log } from "@/common/Logger";
import type { ChatMessage } from "@/common/chat/ChatMessage";
import { ChannelContext } from "@/composable/channel/useChannelContext";
import { Sound, useSound } from "@/composable/useSound";
import { useConfig } from "../useSettings";

interface ChatHighlights {
	highlights: Record<string, HighlightDef>;
	ignores: Record<string, IgnoreDef>;
}

export interface IgnoreDef {
	id: string;

	pattern?: string;
	test?: (msg: ChatMessage) => boolean;
	regexp?: boolean;
	readonly cachedRegExp?: RegExp;

	label: string;
	caseSensitive?: boolean;
	persist?: boolean;
}

export interface HighlightDef extends IgnoreDef {
	color: string;
	flashTitle?: boolean;
	flashTitleFn?: (msg: ChatMessage) => string;
	soundPath?: string;
	soundDef?: Sound;
	soundFile?: {
		name: string;
		type: string;
		data: ArrayBuffer;
	};
}

const m = new WeakMap<ChannelContext, ChatHighlights>();

const customHighlights = useConfig<Map<string, HighlightDef>>("highlights.custom");
const ignores = useConfig<Map<string, IgnoreDef>>("chat.ignores");
const soundVolume = useConfig<number>("highlights.sound_volume");

export function useChatHighlights(ctx: ChannelContext, useIgnored?: boolean) {
	const visibility = useDocumentVisibility();

	const assetsBase = inject(SITE_ASSETS_URL, "");
	const systemSounds = reactive<Record<string, Sound>>({
		ping: useSound(assetsBase + "/sound/ping.ogg"),
	});

	let data = m.get(ctx);
	if (!data) {
		data = reactive<ChatHighlights>({
			highlights: {},
			ignores: {},
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

		watch(
			ignores,
			(h) => {
				if (!data) return;

				// Clear all custom highlights
				for (const [k, v] of Object.entries(data.ignores)) {
					if (!v.persist) continue;
					delete data.ignores[k];
				}

				for (const [, v] of h) {
					data.ignores[v.id] = v;
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

		if (useIgnored) {
			const items: [string, IgnoreDef][] = Array.from(Object.values(data.ignores))
				.filter((h) => h.persist)
				.map((h) => [
					h.id,
					toRaw({
						...h,
					}),
				]);
			ignores.value = new Map(items);
		} else {
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
		}
	}, 250);

	function define(
		id: string,
		def: Omit<HighlightDef | IgnoreDef, "id">,
		persist?: boolean,
	): HighlightDef | IgnoreDef {
		if (!data) return {} as HighlightDef | IgnoreDef;

		if (isHighlight(def)) {
			const h = (data.highlights[id] = { ...def, id, persist });
			updateSoundData(h);

			if (!persist) return h;

			// Store to DB\andymilonakis
			customHighlights.value.set(id, markRaw(h));

			save();

			return h;
		} else {
			const h = (data.ignores[id] = { ...def, id, persist });

			if (!persist) return h;

			// Store to DB\andymilonakis
			ignores.value.set(id, markRaw(h));

			save();

			return h;
		}
	}

	function defineIgnore(id: string, def: Omit<IgnoreDef, "id">, persist?: boolean): IgnoreDef {
		if (!data) return {} as IgnoreDef;

		const h = (data.ignores[id] = { ...def, id, persist });

		if (!persist) return h;

		// Store to DB
		ignores.value.set(id, markRaw(h));
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

		if (useIgnored) {
			delete data.ignores[id];
		} else {
			delete data.highlights[id];
		}
		save();
	}

	function checkMatch(key: string, msg: ChatMessage): boolean {
		if (!data) return false;

		const h = useIgnored ? data?.ignores[key] : data?.highlights[key];
		if (!h) return false;

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

		if (ok && !useIgnored && isHighlight(h)) {
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

	function getAllIgnored(): Record<string, IgnoreDef> {
		if (!data) return {};

		return toReactive(data.ignores);
	}

	function updateId(oldId: string, newId: string): void {
		if (!data) return;
		if (useIgnored) {
			const h = data.ignores[oldId];
			if (!h) return;

			data.ignores[newId] = h;
			delete data.ignores[oldId];

			h.id = newId;
		} else {
			const h = data.highlights[oldId];
			if (!h) return;

			data.highlights[newId] = h;
			delete data.highlights[oldId];

			h.id = newId;
		}

		save();
	}

	function checkIgnored(message: ChatMessage<ComponentFactory>) {
		const allIgnores = Object.values(getAllIgnored());
		return allIgnores.some((s) => checkMatch(s.id, message));
	}

	return {
		define,
		remove,
		getAll,
		getAllIgnored,
		save,
		updateId,
		checkMatch,
		updateSoundData,
		updateFlashTitle,
		checkIgnored,
	};
}

const isHighlight = (def: Omit<HighlightDef | IgnoreDef, "id">): def is HighlightDef => {
	return (def as HighlightDef).color !== undefined;
};
