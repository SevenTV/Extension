import { reactive, ref } from "vue";
import { until, useDocumentVisibility, useIntervalFn, useTitle } from "@vueuse/core";
import type { ChatMessage } from "@/common/chat/ChatMessage";
import { ChannelContext } from "@/composable/channel/useChannelContext";
import { Sound, useSound } from "@/composable/useSound";
import { useConfig } from "../useSettings";

interface ChatHighlights {
	phrases: Record<string, HighlightDef>;
}

interface HighlightDef {
	phrase: string | RegExp | ((msg: ChatMessage) => boolean);
	color: string;
	label: string;
	flashTitle?: (msg: ChatMessage) => string;
	soundPath?: string;
	soundDef?: Sound;
}

const m = new WeakMap<ChannelContext, ChatHighlights>();

const shouldPlaySoundOnHighlight = useConfig<boolean>("highlights.basic.mention_sound");
const shouldFlashTitleOnHighlight = useConfig<boolean>("highlights.basic.mention_title_flash");

export function useChatHighlights(ctx: ChannelContext) {
	const visibility = useDocumentVisibility();

	let data = m.get(ctx);
	if (!data) {
		data = reactive<ChatHighlights>({
			phrases: {},
		});

		m.set(ctx, data);
	}

	function defineHighlight(key: string, def: HighlightDef): void {
		if (!data) return;

		data.phrases[key] = def;
		if (def.soundPath) {
			def.soundDef = useSound(def.soundPath);
		}
	}

	function checkMatch(key: string, msg: ChatMessage, caseSensitive = true): boolean {
		if (!data) return false;

		const h = data?.phrases[key];
		if (!h) return false;

		const body = caseSensitive ? msg.body : msg.body.toLowerCase();

		let ok = false;
		if (typeof h.phrase === "string") {
			ok = body.toLowerCase().includes(h.phrase);
		} else if (h.phrase instanceof RegExp) {
			ok = h.phrase.test(body);
		} else if (typeof h.phrase === "function") {
			ok = h.phrase(msg);
		}

		if (ok) {
			msg.setHighlight(h.color, h.label);

			if (h.soundDef && shouldPlaySoundOnHighlight.value) {
				h.soundDef.play();
			}

			if (h.flashTitle && shouldFlashTitleOnHighlight.value) {
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
		if (!def.flashTitle || titleFlash.isActive.value) return;

		lastKnownTitle.value = document.title;
		newTitle.value = def.flashTitle(msg);

		titleFlash.resume();

		until(visibility)
			.toBe("visible")
			.then(() => {
				titleFlash.pause();
				newTitle.value = "";
				document.title = lastKnownTitle.value;
			});
	}

	return {
		defineHighlight,
		checkMatch,
	};
}
