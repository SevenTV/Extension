<template>
	<template v-if="inputContainer && editorRef">
		<ChatInput :key="inputVersion" :anchor-el="inputContainer" :editor="editorRef" />
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, ref, shallowRef, toRaw } from "vue";
import { useMutationObserver } from "@vueuse/core";
import { declareModule } from "@/composable/useModule";
import ChatInput from "@/site/kick.com/modules/chat-input/ChatInput.vue";

const { markAsReady } = declareModule<"KICK">("chat-input", {
	name: "Chat Input",
	depends_on: [],
});

const editorRef = shallowRef<Kick.Lexical.LexicalEditor | null>(null);
const inputContainer = ref<HTMLDivElement | null>(null);
const inputVersion = ref(0);

function refreshInput(): void {
	const wrapper = document.querySelector<HTMLDivElement>("#channel-chatroom #chat-input-wrapper");
	const input = wrapper?.querySelector<HTMLDivElement>(".editor-input");
	const editor = input && "__lexicalEditor" in input ? (input.__lexicalEditor as Kick.Lexical.LexicalEditor) : null;

	if (inputContainer.value !== wrapper || toRaw(editorRef.value) !== editor) inputVersion.value += 1;
	inputContainer.value = wrapper ?? null;
	editorRef.value = editor;
}

let refreshFrame = 0;
function scheduleInputRefresh(): void {
	if (refreshFrame) return;

	refreshFrame = requestAnimationFrame(() => {
		refreshFrame = 0;
		refreshInput();
	});
}

// Kick replaces the chat editor when its responsive layout changes. Observe the
// document rather than only the original chat container so the new editor is found.
useMutationObserver(document.body, scheduleInputRefresh, { childList: true, subtree: true });
refreshInput();

onUnmounted(() => {
	if (refreshFrame) cancelAnimationFrame(refreshFrame);
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
