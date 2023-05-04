import { InjectionKey, Ref, inject } from "vue";

export const FOCUSED_CHATTERS_KEY: InjectionKey<Ref<Array<string>>> = Symbol("seventv-focused-chatters");

export function useFocusedChatters() {
	const focusedChatters = inject(FOCUSED_CHATTERS_KEY);

	return focusedChatters;
}
