<template>
	<template v-if="inputContainer && editorRef">
		<ChatInput :anchor-el="inputContainer" :editor="editorRef" />
	</template>
</template>

<script setup lang="ts">
import { ref, toRaw, watch } from "vue";
import { useMutationObserver } from "@vueuse/core";
import { declareModule } from "@/composable/useModule";
import ChatInput from "@/site/kick.com/modules/chat-input/ChatInput.vue";

const { markAsReady } = declareModule<"KICK">("chat-input", {
	name: "Chat Input",
	depends_on: [],
});

const editorRef = ref<Kick.Lexical.LexicalEditor | null>(null);

const mainContainer = document.querySelector<HTMLDivElement>("div[data-chat] > div:has(div > main)");

const chatContainer = ref<HTMLDivElement | null>(document.querySelector<HTMLDivElement>("#channel-chatroom") ?? null);
const inputContainer = ref<HTMLDivElement | null>(null);

useMutationObserver(
	mainContainer,
	() => {
		chatContainer.value = document.querySelector<HTMLDivElement>("#channel-chatroom") ?? null;
	},
	{ childList: true },
);

watch(
	chatContainer,
	(container) => {
		const wrapper = container?.querySelector<HTMLDivElement>("#chat-input-wrapper") ?? null;
		inputContainer.value = wrapper;

		if (!wrapper) {
			editorRef.value = null;
		}

		if (!container) return;

		const input = wrapper?.querySelector<HTMLDivElement>(".editor-input");
		if (!input) return;

		if (!("__lexicalEditor" in input)) return;

		editorRef.value = input.__lexicalEditor as Kick.Lexical.LexicalEditor;
	},
	{ immediate: true },
);

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
