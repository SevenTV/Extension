import { markRaw, reactive, toRaw, watch } from "vue";
import { toReactive } from "@vueuse/core";
import { debounceFn } from "@/common/Async";
import { log } from "@/common/Logger";
import type { ChatMessage } from "@/common/chat/ChatMessage";
import { ChannelContext } from "@/composable/channel/useChannelContext";
import { useConfig } from "../useSettings";

interface ChatBlocking {
	blockedPhrases: Record<string, BlockedPhraseDef>;
}

export interface BlockedPhraseDef {
	id: string;

	pattern?: string;
	test?: (msg: ChatMessage) => boolean;
	regexp?: boolean;
	readonly cachedRegExp?: RegExp;

	label: string;
	caseSensitive?: boolean;
	persist?: boolean;
}

const m = new WeakMap<ChannelContext, ChatBlocking>();

const blockedPhrases = useConfig<Map<string, BlockedPhraseDef>>("chat_input.blocking.phrases");

export function useChatBlocking(ctx: ChannelContext) {
	let data = m.get(ctx);
	if (!data) {
		data = reactive<ChatBlocking>({
			blockedPhrases: {},
		});

		watch(
			blockedPhrases,
			(h) => {
				if (!data) return;

				for (const [k, v] of Object.entries(data.blockedPhrases)) {
					if (!v.persist) continue;

					delete data.blockedPhrases[k];
				}

				for (const [, v] of h) {
					data.blockedPhrases[v.id] = v;
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

		const items: [string, BlockedPhraseDef][] = Array.from(Object.values(data.blockedPhrases))
			.filter((h) => h.persist)
			.map((h) => [h.id, toRaw(h)]);

		blockedPhrases.value = new Map(items);
	}, 250);

	function define(id: string, def: Omit<BlockedPhraseDef, "id">, persist?: boolean): BlockedPhraseDef {
		if (!data) return {} as BlockedPhraseDef;

		const h = (data.blockedPhrases[id] = { ...def, id, persist });

		if (!persist) return h;

		// Store to DB
		blockedPhrases.value.set(id, markRaw(h));
		save();

		return h;
	}

	function remove(id: string): void {
		if (!data) return;

		delete data.blockedPhrases[id];
		save();
	}

	function checkMatch(blockedPhraseDef: BlockedPhraseDef, msg: ChatMessage): boolean {
		if (!data || !blockedPhraseDef) return false;

		let ok = false;

		if (blockedPhraseDef.regexp) {
			let regexp = blockedPhraseDef.cachedRegExp;
			if (!regexp) {
				try {
					regexp = new RegExp(blockedPhraseDef.pattern as string, "i");
					Object.defineProperty(blockedPhraseDef, "cachedRegExp", { value: regexp });
				} catch (err) {
					log.warn("<ChatBlocking>", "Invalid regexp:", blockedPhraseDef.pattern ?? "");

					msg.setHighlight("#878787", "Error " + (err as Error).message);
					return false;
				}
			}

			ok = regexp.test(msg.body);
		} else if (blockedPhraseDef.pattern) {
			ok = blockedPhraseDef.caseSensitive
				? msg.body.includes(blockedPhraseDef.pattern)
				: msg.body.toLowerCase().includes(blockedPhraseDef.pattern.toLowerCase());
		} else if (typeof blockedPhraseDef.test === "function") {
			ok = blockedPhraseDef.test(msg);
		}

		return ok;
	}

	function doesMessageContainBlockedPhrase(message: ChatMessage<ComponentFactory>) {
		return Object.values(getAll()).some((s) => checkMatch(s, message));
	}

	function getAll(): Record<string, BlockedPhraseDef> {
		if (!data) return {};

		return toReactive(data.blockedPhrases);
	}

	function updateId(oldId: string, newId: string): void {
		if (!data) return;

		const h = data.blockedPhrases[oldId];
		if (!h) return;

		data.blockedPhrases[newId] = h;
		delete data.blockedPhrases[oldId];

		h.id = newId;

		save();
	}

	return {
		define,
		remove,
		getAll,
		doesMessageContainBlockedPhrase,
		save,
		updateId,
		checkMatch,
	};
}
