<template>
	<template v-if="colon.active && colon.matches.length">
		<UiFloating
			:anchor="anchorEl"
			:middleware="[shift({ crossAxis: true, mainAxis: true }), offset({ crossAxis: 0 })]"
			placement="top-start"
		>
			<div ref="colonList" class="seventv-autocomplete-list">
				<div
					v-for="(match, i) in colon.matches"
					:key="i"
					class="seventv-autocomplete-item"
					:selected="i === colon.select"
					@click="insertAtAnchor(match.token)"
				>
					<template v-if="match.item">
						<Emote :emote="match.item" :scale="match.item.provider === 'PLATFORM' ? 0.45 : 1.0" />
						<span class="seventv-autocomplete-item-name">{{ match.item.name }}</span>
						<span
							v-if="
								match.item.provider &&
								match.item.provider !== 'EMOJI' &&
								match.item.provider !== 'PLATFORM'
							"
							class="seventv-autocomplete-item-provider"
							>({{ match.item.provider }})</span
						>
					</template>
					<template v-else>
						<span class="seventv-autocomplete-item-name">{{ match.token }}</span>
					</template>
				</div>
			</div>
		</UiFloating>
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, reactive, ref, toRaw, toRef, watch } from "vue";
import { useMagicKeys } from "@vueuse/core";
import { useStore } from "@/store/main";
import { TabToken, getSearchRange } from "@/common/Input";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useCosmetics } from "@/composable/useCosmetics";
import { useWorker } from "@/composable/useWorker";
import Emote from "@/app/chat/Emote.vue";
import UiFloating from "@/ui/UiFloating.vue";
import { offset, shift } from "@floating-ui/dom";

const props = defineProps<{
	anchorEl: HTMLElement;
	editor: Kick.Lexical.LexicalEditor;
}>();

const ctx = useChannelContext();
const { sendMessage: sendWorkerMessage } = useWorker();

const { identity } = useStore();
const emotes = useChatEmotes(ctx);
const cosmetics = useCosmetics(identity?.id ?? "");

const colonList = ref<HTMLDivElement | null>(null);
const editorRef = toRef(props, "editor");

const tabState = ref<
	| {
			index: number;
			matches: TabToken[];
			currentMatch: TabToken;
			expectedOffset: number;
			expectedWord: string;
	  }
	| undefined
>();

const colon = reactive({
	active: false,
	cursor: "",
	matches: [] as TabToken[],
	select: 0,
});

const history = reactive({
	index: 0,
	messages: [] as Kick.Lexical.EditorState[],
});

const TextNode = props.editor._nodes.get("text")?.klass as typeof Kick.Lexical.TextNode;

const listeners = new Set<() => void>();

function onSendMessage() {
	sendWorkerMessage("CHANNEL_ACTIVE_CHATTER", {
		channel: toRaw(ctx),
	});

	history.messages.unshift(props.editor.getEditorState());
}

function findCommandListener(predicate: (listener: Kick.Lexical.CommandListener<unknown>) => boolean) {
	const editor = toRaw(editorRef.value);

	return Array.from(editor._commands.entries()).find(([, entries]) =>
		entries.find((listeners) => Array.from(listeners).find(predicate)),
	);
}

const { shift: isShiftPressed } = useMagicKeys();

function onKeyDown(ev: KeyboardEvent) {
	const editor = toRaw(editorRef.value);
	const state = editor.getEditorState();
	const selection = state?._selection;

	if (!state || !selection) return;

	editor.update(() => {
		const [node] = selection.getNodes() ?? [];

		switch (ev.key) {
			case "Tab":
			case "Enter":
				if (colon.active) {
					ev.stopPropagation();
					insertAtAnchor(colon.matches[colon.select].token);
					colon.active = false;
				} else {
					ev.preventDefault();
					handleTab(node, selection as Kick.Lexical.RangeSelection, isShiftPressed.value);
				}
				break;
			case "ArrowUp":
			case "ArrowDown": {
				const direction = ev.key === "ArrowUp" ? "up" : "down";

				if (colon.active) {
					ev.preventDefault();

					if (direction === "up") {
						if (colon.select === 0) colon.select = colon.matches.length;
						colon.select = Math.max(0, colon.select - 1);
					} else {
						if (colon.select === colon.matches.length - 1) colon.select = 0;
						else colon.select = Math.min(colon.matches.length - 1, colon.select + 1);
					}

					const selectedItem = colonList.value?.children.item(colon.select);
					selectedItem?.scrollIntoView({
						block: "nearest",
						inline: "nearest",
					});
				} else {
					const state = editor.getEditorState();
					const root = state._nodeMap.get("root") as Kick.Lexical.RootNode;
					const children = root?.getChildren() ?? [];

					if (children.length > 0) {
						ev.preventDefault();

						const content = root?.getTextContent();
						if (direction === "up") {
							history.index = content?.length
								? Math.min(history.messages.length - 1, history.index + 1)
								: 0;
						} else {
							history.index = Math.max(0, history.index - 1);
						}

						editor.setEditorState(history.messages[history.index]);
					}
				}

				break;
			}
			case "Escape":
				colon.active = false;
				break;
			default:
				history.index = 0;
				break;
		}
	});
}

function handleInputChange(): void {
	const editor = toRaw(editorRef.value);

	const state = editor.getEditorState();
	const selection = state._selection as Kick.Lexical.RangeSelection;
	const [node] = selection.getNodes();

	const anchorOffset = selection.anchor.offset;

	const text = node.getTextContent();
	const [wordStart, wordEnd] = getSearchRange(text, anchorOffset);
	const currentWord = text.substring(wordStart, wordEnd);

	const lastColonAt = currentWord.lastIndexOf(":");

	// no space since last colon
	if (lastColonAt === -1 || currentWord.substring(lastColonAt).indexOf(" ") !== -1) {
		colon.active = false;
	} else {
		colon.active = true;
	}

	if (colon.active) {
		const textAfterColon = currentWord.substring(currentWord.lastIndexOf(":") + 1) ?? "";
		colon.cursor = textAfterColon;

		colon.matches = [
			...Object.values(emotes.active),
			...Object.values(cosmetics.emotes),
			...Object.values(emotes.byProvider("PLATFORM")).reduce<SevenTV.ActiveEmote[]>(
				(accum, set) => [...accum, ...set.emotes],
				[],
			),
		]
			.filter((e) => e.name.toLowerCase().includes(textAfterColon.toLowerCase()))
			.sort((a, b) => a.name.length - b.name.length)
			.slice(0, 25)
			.map((e) => ({
				token: e.unicode || e.name,
				priority: e.name.length,
				item: e,
			}));

		if (colon.select > colon.matches.length - 1) {
			colon.select = Math.max(0, colon.matches.length - 1);
		}
	}
}

function insertAtAnchor(value: string): void {
	const editor = toRaw(editorRef.value);

	editor.focus(() => {
		editor.update(() => {
			const state = editor.getEditorState();
			const selection = state._selection as Kick.Lexical.RangeSelection;
			const anchor = selection.anchor;

			const anchorOffset = anchor.offset;
			const node = anchor.getNode();
			const text = node.getTextContent();

			if (!(node instanceof TextNode)) return;

			if (node instanceof TextNode) {
				const endIndex = text.substring(0, anchorOffset).lastIndexOf(" ", anchorOffset) + 1;

				node.spliceText(endIndex, Math.abs(anchorOffset - endIndex), value + " ", true);
			}
		});
	});
}

function handleTab(node: Kick.Lexical.LexicalNode, selection: Kick.Lexical.RangeSelection, isBackwards = false): void {
	const editor = toRaw(editorRef.value);
	const anchorOffset = selection.anchor.offset;

	const text = node.getTextContent();
	const [wordStart, wordEnd] = getSearchRange(text, anchorOffset);
	const currentWord = text.substring(wordStart, wordEnd);

	if (anchorOffset === wordStart) {
		tabState.value = undefined;
		return;
	}

	const state = tabState.value;

	let match: TabToken | undefined;
	let matchIndex = 0;
	let matches: TabToken[];

	if (!state || state.expectedOffset !== selection.anchor.offset || state.expectedWord !== currentWord) {
		const searchWord = currentWord.endsWith(" ") ? currentWord.slice(0, -1) : currentWord;
		matches = [
			...Object.values(emotes.active),
			...Object.values(cosmetics.emotes),
			...Object.values(emotes.byProvider("PLATFORM")).reduce<SevenTV.ActiveEmote[]>(
				(accum, set) => [...accum, ...set.emotes],
				[],
			),
		]
			.filter((ae) => ae.name.toLowerCase().startsWith(searchWord.toLowerCase()) && ae.provider !== "EMOJI")
			.map((e) => ({
				token: e.unicode || e.name,
				priority: e.name.length,
				item: e,
			}));
		matches.sort((a, b) => a.token.localeCompare(b.token));
		match = matches[matchIndex];
		if (matches.length === 0) return;
	} else {
		matches = state.matches;
		matchIndex = isBackwards ? state.index - 1 : state.index + 1;
		matchIndex %= matches.length;
		if (isBackwards && matchIndex < 0) matchIndex = matches.length - 1;
		match = matches[matchIndex];
	}

	if (match) {
		editor.focus(() => {
			editor.update(() => {
				const anchor = selection.anchor;
				const node = anchor.getNode();

				if (!(node instanceof TextNode)) return;

				const newText = match!.token + " ";
				const newOffset = wordStart + newText.length;
				node.spliceText(wordStart, wordEnd - wordStart, newText, true);

				tabState.value = {
					index: matchIndex,
					matches: matches,
					currentMatch: match!,
					expectedOffset: newOffset,
					expectedWord: newText,
				};
			});
		});
		editor.blur();
	} else {
		tabState.value = undefined;
	}
}

function resetColon() {
	colon.matches = [];
	colon.select = 0;
	colon.active = false;
	colon.cursor = "";
}

watch(
	editorRef,
	(editor) => {
		const removeTextNodeTransform = editor.registerNodeTransform(TextNode, handleInputChange);
		listeners.add(removeTextNodeTransform);

		const removeTextContentListener = editor.registerTextContentListener((text) => {
			if (text.length === 0) resetColon();
		});
		listeners.add(removeTextContentListener);

		const keyEnterListener = findCommandListener((listener) =>
			["preventDefault", "dispatchCommand", "shiftKey"].every((raw) => listener.toString().includes(raw)),
		);

		if (keyEnterListener) {
			const [KEY_ENTER_COMMAND] = keyEnterListener;

			const removeCommand = editor.registerCommand(
				KEY_ENTER_COMMAND,
				() => {
					// If we're currently within colons we prevent the text to be sent.
					if (colon.active) {
						return true;
					}

					onSendMessage();
					return false;
				},
				3, // CommandListenerPriority.COMMAND_PRIORITY_HIGH
			);

			listeners.add(removeCommand);
		}

		const removeRootListener = editor.registerRootListener((rootEl, prevRootEl) => {
			prevRootEl?.removeEventListener("keydown", onKeyDown);
			rootEl?.addEventListener("keydown", onKeyDown);
		});
		listeners.add(removeRootListener);

		// Delete the emote suggestion transformer to avoid native emote suggestions
		const textTransforms = editor._nodes.get("text")?.transforms ?? new Set();
		const emoteSuggestionTransformer = [...textTransforms].find((transformer) =>
			["chat_emote_suggestion_list"].every((text) => transformer.toString().includes(text)),
		);

		if (emoteSuggestionTransformer) {
			textTransforms.delete(emoteSuggestionTransformer);
		}
	},
	{ immediate: true },
);

onUnmounted(() => {
	for (const listener of listeners) {
		listener();
	}

	listeners.clear();
});
</script>

<style lang="scss" scoped>
.seventv-autocomplete-list {
	display: grid;
	background-color: rgb(23, 28, 30);
	border: 1px solid rgba(168, 177, 184, 13.3%);
	backdrop-filter: blur(2rem);
	border-radius: 0.25rem;
	padding: 0.5rem;
	max-height: 16em;
	max-width: 18.3em;
	overflow: auto;
	margin-bottom: 0.5rem;
}

.seventv-autocomplete-item {
	display: grid;
	grid-template-columns: 4rem 1fr 1fr;
	align-items: center;
	align-content: center;
	row-gap: 1em;
	column-gap: 0.5em;
	padding: 0.5em 0;
	border-radius: 0.125rem;
	padding-right: 0.5em;

	&:hover {
		cursor: pointer;
		background-color: rgba(255, 255, 255, 10%);
	}

	&[selected="true"] {
		background-color: rgba(255, 255, 255, 5%);
	}
}

.seventv-autocomplete-item-provider {
	color: var(--seventv-primary);
}
</style>
