<template>
	<template v-if="inputContainer && editorRef">
		<ChatInput :key="inputVersion" :anchor-el="inputContainer" :editor="editorRef" />
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, ref, shallowRef, toRaw } from "vue";
import { declareModule } from "@/composable/useModule";
import ChatInput from "@/site/kick.com/modules/chat-input/ChatInput.vue";

const { markAsReady } = declareModule<"KICK">("chat-input", {
	name: "Chat Input",
	depends_on: [],
});

const editorRef = shallowRef<Kick.Lexical.LexicalEditor | null>(null);
const inputContainer = ref<HTMLDivElement | null>(null);
const inputVersion = ref(0);
let boundInput: HTMLDivElement | null = null;
let refreshTimeout = 0;

function refreshInput(): void {
	const wrapper = document.querySelector<HTMLDivElement>("#channel-chatroom #chat-input-wrapper");
	const input = wrapper?.querySelector<HTMLDivElement>(".editor-input") ?? null;
	const editor = input && "__lexicalEditor" in input ? (input.__lexicalEditor as Kick.Lexical.LexicalEditor) : null;

	if (inputContainer.value !== wrapper || boundInput !== input || toRaw(editorRef.value) !== editor) {
		inputVersion.value += 1;
	}
	boundInput = input;
	inputContainer.value = wrapper ?? null;
	editorRef.value = editor;

	// React can attach Lexical after inserting the editor element.
	if (input && !editor) scheduleInputRefresh(100);
}

function scheduleInputRefresh(delay = 0): void {
	window.clearTimeout(refreshTimeout);
	refreshTimeout = window.setTimeout(refreshInput, delay);
}

function refreshAfterResize(): void {
	// Kick swaps the editor after applying its responsive chat layout.
	scheduleInputRefresh(150);
}

const editorSelector = "#channel-chatroom, #chat-input-wrapper, .editor-input";
const inputObserver = new MutationObserver((records) => {
	// Ignore text changes and suggestion rendering inside the existing editor.
	// Only inserting/removing the editor or its containers needs a new binding.
	const editorChanged = records.some((record) =>
		[...Array.from(record.addedNodes), ...Array.from(record.removedNodes)].some(
			(node) => node instanceof Element && (node.matches(editorSelector) || !!node.querySelector(editorSelector)),
		),
	);
	if (editorChanged) scheduleInputRefresh();
});
inputObserver.observe(document.body, { childList: true, subtree: true });
window.addEventListener("resize", refreshAfterResize);
refreshInput();

onUnmounted(() => {
	window.removeEventListener("resize", refreshAfterResize);
	inputObserver.disconnect();
	window.clearTimeout(refreshTimeout);
});

function appendText(text: string) {
	const editor = toRaw(editorRef.value);
	if (!editor) return;

	editor.focus(() => {
		editor.update(() => {
			const state = editor.getEditorState();
			const root = state._nodeMap.get("root") as Kick.Lexical.RootNode;

			const TextNode = editor._nodes.get("text")?.klass as typeof Kick.Lexical.TextNode;
			const ParagraphNode = editor._nodes.get("paragraph")?.klass as typeof Kick.Lexical.ParagraphNode;

			const lastChild = root.getLastChild();
			const newNode = new TextNode(text);

			if (lastChild instanceof ParagraphNode) {
				const content = lastChild.getTextContent();
				lastChild.append(newNode);

				if (content.length !== 0 && !content.endsWith(" ")) {
					newNode.insertBefore(new TextNode(" "));
				}

				newNode.insertAfter(new TextNode(" "));
				lastChild.selectEnd();
			} else {
				const paragraph = new ParagraphNode();
				paragraph.append(newNode);
				paragraph.selectEnd();
				root.append(paragraph);
			}
		});
	});
	editor.blur();
}

defineExpose({
	appendText,
	container: inputContainer,
});

markAsReady();
</script>
