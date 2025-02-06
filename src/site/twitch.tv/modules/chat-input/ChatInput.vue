<template>
	<ChatInputCarousel
		v-if="tabState && tabState.currentMatch && shouldRenderAutocompleteCarousel"
		:current-match="tabState.currentMatch"
		:forwards-matches="tabState.forwardsMatches ?? []"
		:backwards-matches="tabState.backwardsMatches ?? []"
		:instance="instance"
		@back="(ev) => handleTabPress(ev, true)"
		@forward="(ev) => handleTabPress(ev, false)"
	/>
</template>

<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useMagicKeys } from "@vueuse/core";
import { useStore } from "@/store/main";
import { REACT_TYPEOF_TOKEN } from "@/common/Constant";
import { imageHostToSrcset } from "@/common/Image";
import { TabToken, getSearchRange } from "@/common/Input";
import { HookedInstance } from "@/common/ReactHooks";
import {
	defineFunctionHook,
	defineNamedEventHandler,
	definePropertyHook,
	unsetNamedEventHandler,
	unsetPropertyHook,
} from "@/common/Reflection";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useCosmetics } from "@/composable/useCosmetics";
import { getModule } from "@/composable/useModule";
import { useConfig } from "@/composable/useSettings";
import { useUserAgent } from "@/composable/useUserAgent";
import ChatInputCarousel from "./ChatInputCarousel.vue";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatAutocompleteComponent>;
}>();

interface AutocompleteResult {
	current: string;
	type: string;
	element: unknown;
	replacement: string;
}

const AUTOCOMPLETION_MODE = {
	OFF: 0,
	COLON: 1,
	ALWAYS_ON: 2,
};

const mod = getModule<"TWITCH", "chat-input">("chat-input");
const store = useStore();
const ctx = useChannelContext(props.instance.component.componentRef.props.channelID, true);
const messages = useChatMessages(ctx);
const emotes = useChatEmotes(ctx);
const cosmetics = useCosmetics(store.identity?.id ?? "");
const ua = useUserAgent();

const autocompletionMode = useConfig("chat_input.autocomplete");
const shouldColonCompleteEmoji = useConfig("chat_input.autocomplete.emoji");
const shouldAutocompleteChatters = useConfig("chat_input.autocomplete.chatters");
const shouldRenderAutocompleteCarousel = useConfig("chat_input.autocomplete.carousel");
const mayUseControlEnter = useConfig("chat_input.spam.rapid_fire_send");
const colonCompletionMode = useConfig<number>("chat_input.autocomplete.mode");
const tabCompletionMode = useConfig<number>("chat_input.autocomplete.carousel.mode");

const providers = ref<Record<string, Twitch.ChatAutocompleteProvider>>({});

const TAB_AROUND_MATCH_COUNT = 3;
const tabState = ref<
	| {
			index: number;
			matches: TabToken[];
			currentMatch: TabToken;
			forwardsMatches: TabToken[];
			backwardsMatches: TabToken[];
			expectedPath: number[];
			expectedOffset: number;
			expectedWord: string;
	  }
	| undefined
>();

const textValue = ref("");
const awaitingUpdate = ref(false);

const preHistory = ref<Twitch.ChatSlateLeaf[] | undefined>();
const history = ref<Twitch.ChatSlateLeaf[][]>([]);
const historyLocation = ref(-1);

const { ctrl: isCtrl, shift: isShift } = useMagicKeys();

function findMatchingTokens(str: string, mode: "tab" | "colon" = "tab", limit?: number): TabToken[] {
	const usedTokens = new Set<string>();

	const matches: TabToken[] = [];

	// Test modes
	// 0: startsWith
	// 1: includes
	const testMode = mode === "tab" ? tabCompletionMode.value : colonCompletionMode.value;

	const prefix = str.toLowerCase();
	const test = (token: string) =>
		({
			0: token.toLowerCase().startsWith(prefix),
			1: token.toLowerCase().includes(prefix),
		})[testMode];

	for (const [token, ae] of Object.entries(cosmetics.emotes)) {
		if (usedTokens.has(token) || !test(token)) continue;

		usedTokens.add(token);
		matches.push({
			token,
			priority: 1,
			item: ae,
		});
	}

	for (const [provider, sets] of Object.entries(emotes.providers)) {
		if (provider == "EMOJI") continue;

		for (const [, set] of Object.entries(sets)) {
			for (const emote of set.emotes) {
				const token = emote.name;

				if (usedTokens.has(token) || !test(token)) continue;

				usedTokens.add(token);
				matches.push({
					token,
					priority: 2,
					item: emote,
				});
			}
		}
	}

	if (mode === "colon") {
		for (const [token] of Object.entries(emotes.emojis)) {
			if (usedTokens.has(token) || !test(token)) continue;

			usedTokens.add(token);
			matches.push({
				token,
				priority: 4,
			});
		}
	}

	if (shouldAutocompleteChatters.value && mode === "tab") {
		const tokenStartsWithAt = prefix.startsWith("@");
		const lPrefix = prefix.replace("@", "");

		const chatters = Object.entries(messages.chatters);
		for (const [, chatter] of chatters) {
			if (usedTokens.has(chatter.displayName) || !chatter.displayName.toLowerCase().startsWith(lPrefix)) continue;

			matches.push({
				token: (tokenStartsWithAt ? "@" : "") + chatter.displayName,
				priority: 10,
			});
		}
	}

	matches.sort((a, b) => a.priority + b.priority * (a.token.localeCompare(b.token) / 0.5));
	if (typeof limit === "number" && matches.length > limit) matches.length = limit;

	return matches;
}

onMounted(() => {
	window.addEventListener("keydown", handleCapturedKeyDown, { capture: true });
});

function handleTabPress(ev: KeyboardEvent | null, isBackwards?: boolean): void {
	const component = props.instance.component;

	const slateComponent = component.componentRef;

	const slate = slateComponent.state?.slateEditor;
	if (!slate) return;

	const cursorLocation = slate.selection?.anchor;
	if (!cursorLocation) return;

	if (ev) {
		ev.preventDefault();
		ev.stopImmediatePropagation();
	}

	let currentNode: { children: Twitch.ChatSlateLeaf[] } & Partial<Twitch.ChatSlateLeaf> = slate;
	for (const i of cursorLocation.path) {
		if (!currentNode) break;
		currentNode = currentNode.children[i];
	}

	let currentWord: string | null = null;
	let wordStart = 0;
	let wordEnd = 0;
	if (currentNode.type == "text" && typeof currentNode.text == "string") {
		const searchText = currentNode.text;
		const searchStart = cursorLocation.offset;

		[wordStart, wordEnd] = getSearchRange(searchText, searchStart);

		if (cursorLocation.offset != wordStart) {
			currentWord = searchText.substring(wordStart, wordEnd);
		}
	}

	if (currentWord && currentWord != " ") {
		const state = tabState.value;

		let match: TabToken | undefined;
		let matchIndex = 0;
		let matches: TabToken[];
		let backwardsMatches: TabToken[] = [];
		let forwardsMatches: TabToken[] = [];

		if (
			!state ||
			state.expectedPath != cursorLocation.path ||
			state.expectedOffset != cursorLocation.offset ||
			state.expectedWord != currentWord
		) {
			const searchWord = currentWord.endsWith(" ") ? currentWord.slice(0, -1) : currentWord;
			matches = findMatchingTokens(searchWord, "tab");
			match = matches[matchIndex];
		} else {
			matches = state.matches;
			matchIndex = isBackwards ? state.index - 1 : state.index + 1;
			matchIndex %= matches.length;
			if (isBackwards && matchIndex < 0) matchIndex = matches.length - 1;
			match = matches[matchIndex];
		}

		backwardsMatches = matches.slice(Math.max(0, matchIndex - TAB_AROUND_MATCH_COUNT), matchIndex);
		forwardsMatches = matches.slice(matchIndex + 1, matchIndex + TAB_AROUND_MATCH_COUNT + 1);

		// when forwardsMatches doesn't have enough matches, add the first matches from the beginning
		if (forwardsMatches.length < TAB_AROUND_MATCH_COUNT) {
			forwardsMatches.push(
				...matches.slice(0, TAB_AROUND_MATCH_COUNT - forwardsMatches.length).filter((tok) => tok !== match),
			);
		}

		// when backwardsMatches doesn't have enough matches, add the last matches from the end
		if (backwardsMatches.length < TAB_AROUND_MATCH_COUNT) {
			backwardsMatches.unshift(
				...matches.slice(backwardsMatches.length - TAB_AROUND_MATCH_COUNT).filter((tok) => tok !== match),
			);
		}

		if (match) {
			const replacement = hasSlateToken(match.token, slateComponent.props.emotes)
				? match.token
				: `${match.token} `;

			awaitingUpdate.value = true;

			slate.apply({ type: "remove_text", path: cursorLocation.path, offset: wordStart, text: currentWord });
			slate.apply({ type: "insert_text", path: cursorLocation.path, offset: wordStart, text: replacement });

			const newOffset = wordStart + replacement.length;

			const newCursor = { path: cursorLocation.path, offset: newOffset };
			slate.apply({ type: "set_selection", newProperties: { anchor: newCursor, focus: newCursor } });

			tabState.value = {
				index: matchIndex,
				matches: matches,
				currentMatch: match,
				backwardsMatches: backwardsMatches,
				forwardsMatches: forwardsMatches,
				expectedOffset: newOffset,
				expectedPath: cursorLocation.path,
				expectedWord: replacement,
			};
		} else {
			tabState.value = undefined;
		}
	}
}

function hasSlateToken(token: string, sets: Twitch.TwitchEmoteSet[]) {
	for (const set of sets) {
		for (const emote of set.emotes) {
			if (emote.token == token) {
				return true;
			}
		}
	}

	return false;
}

function pushHistory() {
	const component = props.instance.component;

	const slateComponent = component.componentRef;

	const slate = slateComponent.state?.slateEditor;
	if (!slate) return;

	history.value.unshift(slate.children);
	history.value.splice(9, Infinity);

	resetState();
}

function useHistory(backwards = true): boolean {
	const component = props.instance.component;

	const slateComponent = component.componentRef;

	const slate = slateComponent.state?.slateEditor;
	if (!slate) return false;

	const hist = history.value;
	let location = historyLocation.value;

	if (backwards) {
		location += 1;
	} else {
		location -= 1;
	}

	if (location < -1 || hist.length < location) {
		return false;
	}

	if (!preHistory.value) {
		preHistory.value = slate.children;
	}

	let value: Twitch.ChatSlateLeaf[] | undefined;
	if (location < 0) {
		value = preHistory.value;
	} else {
		value = hist[location];
	}

	if (value) {
		awaitingUpdate.value = true;

		if (backwards && (slate.selection?.focus.offset ?? 0) > 1) {
			return false;
		} else if (!backwards && (slate.selection?.focus.offset ?? 0) < textValue.value.length) {
			return false;
		}

		for (const i in slate.children) {
			slate.apply({ type: "remove_node", path: [i], node: slate.children[i] });
		}

		for (const i in value) {
			slate.apply({ type: "insert_node", path: [i], node: value[i] });
		}

		const lastChildPath: number[] = [];
		let lastChild: Twitch.ChatSlateLeaf | undefined;
		if (value.length > 0) {
			const index = value.length - 1;

			lastChildPath.push(index);
			lastChild = value[index];

			while (lastChild && lastChild.children && lastChild.children.length > 0) {
				const index: number = lastChild.children.length - 1;

				lastChildPath.push(index);
				lastChild = lastChild.children[index];
			}
		}

		let endOffset = 0;
		if (lastChild && lastChild.type == "text" && lastChild.text) {
			endOffset = lastChild.text.length;
		}

		const newCursor = { path: lastChildPath, offset: endOffset };
		slate.apply({ type: "set_selection", newProperties: { anchor: newCursor, focus: newCursor } });

		historyLocation.value = location;

		return true;
	}

	return false;
}

function resetState() {
	historyLocation.value = -1;
	preHistory.value = undefined;
	tabState.value = undefined;
}

function onKeyDown(ev: KeyboardEvent) {
	if (ev.isComposing) return;

	switch (ev.key) {
		case "Tab":
			handleTabPress(ev, isShift.value);
			break;
		case "ArrowUp":
			if (useHistory(true)) {
				ev.preventDefault();
				ev.stopImmediatePropagation();
			}
			break;
		case "ArrowDown":
			if (useHistory(false)) {
				ev.preventDefault();
				ev.stopImmediatePropagation();
			}
			break;
	}
}

function handleCapturedKeyDown(ev: KeyboardEvent) {
	// Prevents autocompletion on Enter when completion mode is -> always on
	if (ev.key === "Enter") {
		const { component } = props.instance;
		const { componentRef } = component;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const componentProps: any = componentRef.props;
		const activeTray: Twitch.ChatTray = componentProps.tray;
		const slate = componentRef.state?.slateEditor;

		// Exit if autocomplete is not always on or anything needed is unavailable
		if (
			autocompletionMode.value !== AUTOCOMPLETION_MODE.ALWAYS_ON ||
			!activeTray ||
			(activeTray.type as string) !== "autocomplete-tray" ||
			!slate ||
			!slate.selection?.anchor
		) {
			return;
		}

		// Prevents autocompletion
		ev.preventDefault();
		ev.stopImmediatePropagation();
		ev.stopPropagation();

		// Close autocomplete tray by adding a space
		const cursorLocation = slate.selection.anchor;
		let currentNode: { children: Twitch.ChatSlateLeaf[] } & Partial<Twitch.ChatSlateLeaf> = slate;

		for (const index of cursorLocation.path) {
			if (!currentNode) break;
			currentNode = currentNode.children[index];
		}

		const currentWordEnd =
			currentNode.type === "text" && typeof currentNode.text === "string"
				? getSearchRange(currentNode.text, cursorLocation.offset)[1]
				: 0;

		slate.apply({
			type: "insert_text",
			path: cursorLocation.path,
			offset: currentWordEnd,
			text: " ",
		});
	}
}

function getMatchesHook(this: unknown, native: ((...args: unknown[]) => object[]) | null, str: string, ...args: []) {
	if (autocompletionMode.value === AUTOCOMPLETION_MODE.OFF) return;

	if (autocompletionMode.value === AUTOCOMPLETION_MODE.COLON && !str.startsWith(":")) return;

	const search = str.startsWith(":") ? str.substring(1) : str;

	if (search.length < 2) {
		return;
	}

	const results = (native?.call(this, `:${search}`, ...args) ?? []) as AutocompleteResult[];

	if (autocompletionMode.value === AUTOCOMPLETION_MODE.ALWAYS_ON) {
		results.map((r) => (r.current = str));
	}

	const allEmotes = { ...cosmetics.emotes, ...emotes.active, ...emotes.emojis };

	const tokens = findMatchingTokens(search, "colon", 25);

	for (let i = tokens.length - 1; i > -1; i--) {
		const token = tokens[i].token;
		const emote = allEmotes[token];
		if (!emote || (!shouldColonCompleteEmoji.value && emote.provider == "EMOJI")) {
			continue;
		}

		const host = emote?.data?.host ?? { url: "", files: [] };
		const srcset = host.srcset ?? imageHostToSrcset(host, emote.provider, ua.preferredFormat);

		const providerData = emote.provider?.split("/") ?? ["", ""];
		let provider = providerData?.[0] ?? emote.provider;

		switch (emote.scope) {
			case "GLOBAL":
				provider = provider?.concat(" Global");
				break;
			case "PERSONAL":
				provider = provider?.concat(" Personal");
				break;
		}

		results.unshift({
			type: "emote",
			current: str,
			element: [
				emote.provider === "EMOJI"
					? {
							[REACT_TYPEOF_TOKEN]: Symbol.for("react.element"),
							ref: null,
							key: `emote-icon-${emote.id}`,
							type: "svg",
							props: {
								style: {
									width: "3em",
									height: "3em",
									padding: "0.5rem",
								},
								viewBox: "0 0 36 36",
								children: [
									{
										[REACT_TYPEOF_TOKEN]: Symbol.for("react.element"),
										ref: null,
										key: `emote-text-${emote.id}-text`,
										type: "use",
										props: {
											href: `#${emote.id}`,
										},
									},
								],
							},
					  }
					: {
							[REACT_TYPEOF_TOKEN]: Symbol.for("react.element"),
							ref: null,
							key: `emote-img-${emote.id}`,
							type: "img",
							props: {
								style: {
									padding: "0.5rem",
								},
								srcset: srcset,
							},
					  },
				{
					[REACT_TYPEOF_TOKEN]: Symbol.for("react.element"),
					ref: null,
					key: `emote-text-${emote.id}`,
					type: "span",
					props: {
						children: `${emote.name}`,
						style: { "margin-right": "0.25rem" },
					},
				},
				{
					[REACT_TYPEOF_TOKEN]: Symbol.for("react.element"),
					ref: null,
					key: `emote-provider-${emote.id}`,
					type: "span",
					props: {
						children: `(${provider})`,
						class: [`brand-color-${providerData[0].toLowerCase()}`],
					},
				},
			],
			replacement: emote.unicode ?? token,
		});
	}

	return results.length > 0 ? results : undefined;
}

watch(
	() => props.instance.domNodes.root,
	(node, old) => {
		if (node === old) return;

		if (old instanceof HTMLElement) {
			unsetNamedEventHandler(old, "ChatAutoComplete", "keydown");
		}

		if (node instanceof HTMLElement) {
			defineNamedEventHandler(node, "ChatAutoComplete", "keydown", onKeyDown, true);
		}
	},
	{ immediate: true },
);

defineFunctionHook(
	props.instance.component,
	"onEditableValueUpdate",
	function (old, value: string, sendOnUpdate?: boolean, ...args: unknown[]) {
		if (sendOnUpdate) {
			pushHistory();

			// Put the previous input back in if the user was pressing control
			if (mayUseControlEnter.value && isCtrl.value) {
				setTimeout(() => useHistory(true), 0);
			}
		}

		if (!awaitingUpdate.value) {
			resetState();
		}

		awaitingUpdate.value = false;
		textValue.value = value;

		return old?.call(this, value, sendOnUpdate, ...args);
	},
);

const mentionProvider = props.instance.component.providers.find((provider) => provider.autocompleteType == "mention");
if (mentionProvider) {
	providers.value.mention = mentionProvider;
	mentionProvider.canBeTriggeredByTab = false;
	definePropertyHook(mentionProvider as Twitch.ChatAutocompleteProvider<"mention">, "props", {
		value(v) {
			messages.handlers.add(v.activeChattersAPI.handleMessage);
		},
	});
}

const emoteProvider = props.instance.component.providers.find((provider) => provider.autocompleteType == "emote");
if (emoteProvider) {
	providers.value.emote = emoteProvider;
	defineFunctionHook(emoteProvider, "getMatches", getMatchesHook);
}

defineFunctionHook(props.instance.component, "componentDidUpdate", function (this, ...args: unknown[]) {
	if (mod?.instance && typeof this.props.setTray === "function") {
		mod.instance.setTray = this.props.setTray;
		mod.instance.setModifierTray = this.props.setModifierTray;
		mod.instance.clearModifierTray = this.props.clearModifierTray;
	}

	const fn = args[0];
	if (typeof fn === "function") {
		return fn.call(this, ...args.slice(1));
	}

	return args;
});

onUnmounted(() => {
	const component = props.instance.component;

	unsetPropertyHook(component, "onEditableValueUpdate");
	unsetPropertyHook(component, "props");

	if (component.componentRef) {
		unsetPropertyHook(component.componentRef, "props");
	}

	const rootNode = props.instance.domNodes.root;
	if (rootNode instanceof HTMLElement) {
		unsetNamedEventHandler(rootNode, "ChatAutoComplete", "keydown");
	}

	const providerList = providers.value;

	if (providerList.mention) {
		providerList.mention.canBeTriggeredByTab = true;
		unsetPropertyHook(providerList.mention, "props");
	}

	if (providerList.emote) {
		unsetPropertyHook(providerList.emote, "getMatches");
	}
});
</script>
