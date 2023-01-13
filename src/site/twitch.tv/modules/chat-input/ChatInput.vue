<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
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
import { useCosmetics } from "@/composable/useCosmetics";
import { useWorker } from "@/composable/useWorker";
import { useChatAPI } from "@/site/twitch.tv/ChatAPI";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatAutocompleteComponent>;
}>();

const store = useStore();
const { emoteMap, messageHandlers } = useChatAPI();
const { emotes: personalEmoteMap } = useCosmetics(store.identity?.id ?? "");
const { sendMessage } = useWorker();

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

const awaitingUpdate = ref(false);

const preHistory = ref<Twitch.ChatSlateLeaf[] | undefined>();
const history = ref<Twitch.ChatSlateLeaf[][]>([]);
const historyLocation = ref(-1);

interface TabToken {
	token: string;
	fromTwitch: boolean;
}

function findMatchingTokens(str: string, twitchSets?: Twitch.TwitchEmoteSet[]): TabToken[] {
	const usedTokens = new Set<string>();

	const matches: TabToken[] = [];

	const prefix = str.toLowerCase();

	for (const [token] of Object.entries(personalEmoteMap.value)) {
		if (!usedTokens.has(token) && token.toLowerCase().includes(prefix)) {
			usedTokens.add(token);
			matches.push({
				token,
				fromTwitch: false,
			});
		}
	}

	for (const [token] of Object.entries(emoteMap.value)) {
		if (!usedTokens.has(token) && token.toLowerCase().includes(prefix)) {
			usedTokens.add(token);
			matches.push({
				token,
				fromTwitch: false,
			});
		}
	}

	if (twitchSets) {
		for (const set of twitchSets) {
			for (const emote of set.emotes) {
				if (!usedTokens.has(emote.token) && emote.token.toLowerCase().includes(prefix)) {
					usedTokens.add(emote.token);
					matches.push({
						token: emote.token,
						fromTwitch: true,
					});
				}
			}
		}
	}

	matches.sort((a, b) => a.token.localeCompare(b.token));

	return matches;
}

function handleTabPress(ev: KeyboardEvent): void {
	const component = props.instance.component;

	const slateComponent = component.componentRef;

	const slate = slateComponent.state?.slateEditor;
	if (!slate) return;

	const cursorLocation = slate.selection?.anchor;
	if (!cursorLocation) return;

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
			matches = findMatchingTokens(searchWord, component.props.emotes);
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

			ev.preventDefault();
			ev.stopImmediatePropagation();
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

	const results = native?.call(this, str, ...args) ?? [];

	const emotes = { ...personalEmoteMap.value, ...emoteMap.value };
	const tokens = findMatchingTokens(str.substring(1));
	for (let i = tokens.length - 1; i > -1; i--) {
		const token = tokens[i].token;
		const emote = emotes[token];

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
				{
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
			replacement: token,
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

onMounted(() => {
	const component = props.instance.component;

	defineFunctionHook(
		component,
		"onEditableValueUpdate",
		function (old, value: string, sendOnUpdate?: boolean, ...args: unknown[]) {
			if (sendOnUpdate) {
				pushHistory();

				// Tell the worker to write presence
				if (store.channel) {
					sendMessage("CHANNEL_ACTIVE_CHATTER", {
						channel_id: store.channel.id,
					});
				}
			}

			if (!awaitingUpdate.value) {
				resetState();
			}

			awaitingUpdate.value = false;

			return old?.call(this, value, sendOnUpdate, ...args);
		},
	);

	const mentionProvider = component.providers.find((provider) => provider.autocompleteType == "mention");
	if (mentionProvider) {
		providers.value.mention = mentionProvider;
		mentionProvider.canBeTriggeredByTab = false;
		definePropertyHook(mentionProvider as Twitch.ChatAutocompleteProvider<"mention">, "props", {
			value(v: Twitch.ChatAutocompleteProvider<"mention">["props"]) {
				messageHandlers.value.add(v.activeChattersAPI.handleMessage);
			},
		});
	}

	const emoteProvider = component.providers.find((provider) => provider.autocompleteType == "emote");
	if (emoteProvider) {
		providers.value.emote = emoteProvider;
		defineFunctionHook(emoteProvider, "getMatches", getMatchesHook);
	}
});

onUnmounted(() => {
	const component = props.instance.component;

	unsetPropertyHook(component, "onEditableValueUpdate");

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
