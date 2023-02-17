<template />

<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import { useMagicKeys } from "@vueuse/core";
import { useStore } from "@/store/main";
import { REACT_TYPEOF_TOKEN } from "@/common/Constant";
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

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatAutocompleteComponent>;
}>();

const mod = getModule("chat-input");
const store = useStore();
const ctx = useChannelContext(props.instance.component.componentRef.props.channelID);
const messages = useChatMessages(ctx);
const emotes = useChatEmotes(ctx);
const cosmetics = useCosmetics(store.identity?.id ?? "");

const shouldUseColonComplete = useConfig("chat_input.autocomplete.colon");
const shouldColonCompleteEmoji = useConfig("chat_input.autocomplete.colon.emoji");
const shouldAutocompleteChatters = useConfig("chat_input.autocomplete.chatters");
const mayUseControlEnter = useConfig("chat_input.spam.rapid_fire_send");

const providers = ref<Record<string, Twitch.ChatAutocompleteProvider>>({});

const tabState = ref<
	| {
			index: number;
			matches: TabToken[];
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

const { ctrl: isCtrl } = useMagicKeys();

interface TabToken {
	token: string;
	priority: number;
	fromTwitch: boolean;
}

function findMatchingTokens(
	str: string,
	twitchSets?: Twitch.TwitchEmoteSet[],
	mode: "tab" | "colon" = "tab",
): TabToken[] {
	const usedTokens = new Set<string>();

	const matches: TabToken[] = [];

	const prefix = str.toLowerCase();
	const test = (token: string) =>
		({
			tab: token.toLowerCase().startsWith(prefix),
			colon: token.toLowerCase().includes(prefix),
		}[mode]);

	for (const [token] of Object.entries(cosmetics.emotes)) {
		if (usedTokens.has(token) || !test(token)) continue;

		usedTokens.add(token);
		matches.push({
			token,
			priority: 4,
			fromTwitch: false,
		});
	}

	for (const [token] of Object.entries(emotes.active)) {
		if (usedTokens.has(token) || !test(token)) continue;

		usedTokens.add(token);
		matches.push({
			token,
			priority: 3,
			fromTwitch: false,
		});
	}

	if (twitchSets) {
		for (const set of twitchSets) {
			for (const emote of set.emotes) {
				if (usedTokens.has(emote.token) || !test(emote.token)) continue;

				usedTokens.add(emote.token);
				matches.push({
					token: emote.token,
					priority: 2,
					fromTwitch: true,
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
				priority: 1,
				fromTwitch: false,
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
				token: (tokenStartsWithAt ? "@" : "") + chatter.displayName + " ",
				priority: 0,
				fromTwitch: true,
			});
		}
	}

	matches.sort((a, b) => a.priority + b.priority + a.token.localeCompare(b.token));

	return matches;
}

function handleTabPress(ev: KeyboardEvent): void {
	const component = props.instance.component;

	const slateComponent = component.componentRef;

	const slate = slateComponent.state?.slateEditor;
	if (!slate) return;

	const cursorLocation = slate.selection?.anchor;
	if (!cursorLocation) return;

	ev.preventDefault();
	ev.stopImmediatePropagation();

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

		for (let i = searchStart; ; i--) {
			if (i < 1 || (searchText.charAt(i - 1) === " " && i !== searchStart)) {
				wordStart = i;
				break;
			}
		}

		for (let i = searchStart + 1; ; i++) {
			if (i > searchText.length || searchText.charAt(i - 1) === " ") {
				wordEnd = i - 1;
				break;
			}
		}

		if (cursorLocation.offset != wordStart) {
			currentWord = searchText.substring(wordStart, wordEnd);
		}
	}

	if (currentWord && currentWord != " ") {
		const state = tabState.value;

		let match: TabToken | undefined;
		let matchIndex = 0;
		let matches: TabToken[];
		if (
			!state ||
			state.expectedPath != cursorLocation.path ||
			state.expectedOffset != cursorLocation.offset ||
			state.expectedWord != currentWord
		) {
			const searchWord = currentWord.endsWith(" ") ? currentWord.slice(0, -1) : currentWord;
			matches = findMatchingTokens(searchWord, component.props.emotes, "tab");
			match = matches[matchIndex];
		} else {
			matches = state.matches;
			matchIndex = state.index + 1;
			matchIndex %= matches.length;
			match = matches[matchIndex];
		}

		if (match) {
			const replacement = match.fromTwitch ? match.token : `${match.token} `;

			awaitingUpdate.value = true;

			slate.apply({ type: "remove_text", path: cursorLocation.path, offset: wordStart, text: currentWord });
			slate.apply({ type: "insert_text", path: cursorLocation.path, offset: wordStart, text: replacement });

			const newOffset = wordStart + replacement.length;

			const newCursor = { path: cursorLocation.path, offset: newOffset };
			slate.apply({ type: "set_selection", newProperties: { anchor: newCursor, focus: newCursor } });

			tabState.value = {
				index: matchIndex,
				matches: matches,
				expectedOffset: newOffset,
				expectedPath: cursorLocation.path,
				expectedWord: replacement,
			};
		} else {
			tabState.value = undefined;
		}
	}
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
	switch (ev.key) {
		case "Tab":
			handleTabPress(ev);
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

function getMatchesHook(this: unknown, native: ((...args: unknown[]) => object[]) | null, str: string, ...args: []) {
	if (!str.startsWith(":") || str.length < 3) return;
	if (!shouldUseColonComplete.value) return;

	const results = native?.call(this, str, ...args) ?? [];

	const allEmotes = { ...cosmetics.emotes, ...emotes.active, ...emotes.emojis };
	const tokens = findMatchingTokens(str.substring(1), undefined, "colon");

	for (let i = tokens.length - 1; i > -1; i--) {
		const token = tokens[i].token;
		const emote = allEmotes[token];
		if (!emote || (!shouldColonCompleteEmoji.value && emote.provider == "EMOJI")) {
			continue;
		}

		const host = emote?.data?.host ?? { url: "", files: [] };
		const srcset = host.files
			.filter((f) => f.format === host.files[0].format)
			.map((f, i) => `${host.url}/${f.name} ${i + 1}x`)
			.join(", ");

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
			defineNamedEventHandler(node, "ChatAutoComplete", "keydown", onKeyDown);
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
