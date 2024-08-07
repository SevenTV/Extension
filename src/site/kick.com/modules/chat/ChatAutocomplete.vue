<template>
	<template v-if="colon.active && footerEl">
		<UiFloating
			:anchor="footerEl"
			:middleware="[shift({ crossAxis: true, mainAxis: true }), offset({ crossAxis: 16 })]"
			placement="top-start"
		>
			<div ref="colonList" class="seventv-autocomplete-list">
				<div
					v-for="(match, i) in colon.matches"
					:key="i"
					class="seventv-autocomplete-item"
					:selected="i === colon.select"
					@click="insertAtEnd(match.token)"
				>
					<template v-if="match.item">
						<Emote :emote="match.item" :size="24" />
						<span class="seventv-autocomplete-item-name">{{ match.item.name }}</span>
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
import { inject, reactive, ref, toRef, watch, watchEffect } from "vue";
import { useEventListener, useMagicKeys, useMutationObserver } from "@vueuse/core";
import { useStore } from "@/store/main";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useCosmetics } from "@/composable/useCosmetics";
import { KICK_CHANNEL_KEY } from "@/site/kick.com";
import Emote from "@/app/chat/Emote.vue";
import UiFloating from "@/ui/UiFloating.vue";
import { offset, shift } from "@floating-ui/dom";

export interface TabToken {
	token: string;
	priority: number;
	item?: SevenTV.ActiveEmote;
}

const info = inject(KICK_CHANNEL_KEY);
if (!info) throw new Error("Could not retrieve channel info");

const { identity } = useStore();
const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);
const cosmetics = useCosmetics(identity?.id ?? "");

const currentMessage = toRef(info, "currentMessage");
const inputEl = ref<HTMLDivElement | null>(null);
const footerEl = ref<HTMLDivElement | null>(null);
const colonList = ref<HTMLDivElement | null>(null);

const colon = reactive({
	active: false,
	cursor: "",
	matches: [] as TabToken[],
	select: 0,
});

const history = reactive({
	index: 0,
	messages: [] as string[],
});

function handleInputChange(): void {
	if (!inputEl.value || typeof inputEl.value.textContent !== "string") return;

	const lastColonAt = inputEl.value.textContent.lastIndexOf(":");

	// no space since last colon
	if (lastColonAt === -1 || inputEl.value.textContent.substring(lastColonAt).indexOf(" ") !== -1) {
		colon.active = false;
	} else {
		colon.active = true;
	}

	if (colon.active) {
		// get the current text typed after the colon
		const text = inputEl.value.textContent?.substring(inputEl.value.textContent.lastIndexOf(":") + 1) ?? "";
		colon.cursor = text;

		colon.matches = [...Object.values(emotes.active), ...Object.values(cosmetics.emotes)]
			.filter((e) => e.name.toLowerCase().includes(text.toLowerCase()))
			.sort((a, b) => a.name.length - b.name.length)
			.slice(0, 25)
			.map((e) => ({
				token: e.unicode || e.name,
				priority: e.name.length,
				item: e,
			}));

		if (colon.select > colon.matches.length - 1) {
			colon.select = colon.matches.length - 1;
		}
	}
}

function insertAtEnd(value: string): void {
	if (!inputEl.value || typeof inputEl.value.textContent !== "string") return;

	// remove colon-complete cursor if it exists
	const lastColonAt = inputEl.value.textContent.lastIndexOf(":");
	if (lastColonAt !== -1) {
		inputEl.value.textContent = inputEl.value.textContent.substring(0, lastColonAt - 1);
	}

	inputEl.value.textContent +=
		inputEl.value.textContent.charAt(value.length - 1) === " " ? value + " " : ` ${value} `;
	if (info) info.currentMessage = inputEl.value.textContent;

	const range = document.createRange();
	const sel = window.getSelection();
	if (!sel) return;

	range.selectNodeContents(inputEl.value);
	range.collapse(false); // Move cursor to the end
	sel.removeAllRanges();
	sel.addRange(range);

	colon.active = false;
}

const tab = reactive({
	matches: [] as SevenTV.ActiveEmote[],
	index: -1,
	cursorLocation: -1,
	previousText: "",
});

function handleTab(n: Text, sel: Selection, back = false): void {
	const { anchorOffset, focusOffset } = sel;

	const start = Math.min(anchorOffset, focusOffset);
	const end = Math.max(anchorOffset, focusOffset);

	const text = n.textContent ?? "";
	const tokenStart = text.substring(0, focusOffset).lastIndexOf(" ", focusOffset);

	if (sel.anchorOffset != tab.cursorLocation || text !== tab.previousText) {
		tab.matches = [];
		tab.index = -1;
		tab.cursorLocation = sel.anchorOffset;
	}

	const searchWord = text.substring(tokenStart + 1, start);
	if (tab.matches.length === 0) {
		tab.matches = [...Object.values(emotes.active), ...Object.values(cosmetics.emotes)].filter(
			(ae) => ae.name.toLowerCase().startsWith(searchWord.toLowerCase()) && ae.provider !== "EMOJI",
		);
		if (tab.matches.length === 0 || tab.matches[0].provider === "EMOJI") return;
	}
	tab.matches.sort((a, b) => a.name.localeCompare(b.name));

	tab.index = (back ? tab.index - 1 : tab.index + 1) % tab.matches.length;
	if (tab.index < 0) tab.index = tab.matches.length - 1;

	const selectedToken = tab.matches[tab.index];
	const spaceAtEnd = end === n.length;
	const textNode = document.createTextNode(`${selectedToken.name}${spaceAtEnd ? "" : " "}`);
	tab.previousText = textNode.textContent ?? "";

	const range = document.createRange();
	range.setStart(n, start - searchWord.length);
	range.setEnd(n, end);
	range.deleteContents();
	range.insertNode(textNode);

	sel.collapse(textNode, selectedToken.name.length + (spaceAtEnd ? 0 : 1));

	tab.cursorLocation = sel.focusOffset;
}

// add message to history using unshift
function handleMessageSend(text: string) {
	if (!text) return;

	if (history.messages[0] !== text) {
		history.messages.unshift(text);
	}

	history.index = 0;
}

watch(currentMessage, handleInputChange);

const { shift: isShiftPressed } = useMagicKeys();
useEventListener(
	inputEl,
	"keydown",
	(ev: KeyboardEvent) => {
		if (ev.isComposing) return;

		const sel = document.getSelection();
		if (!sel) return;

		const n = sel.focusNode as Text | null;

		switch (ev.key) {
			case "Tab":
			case "Enter":
				if (ev.key === "Tab" && n && n.nodeName === "#text") {
					ev.preventDefault();
					handleTab(n, sel, isShiftPressed.value);
				}

				if (!colon.active) break;

				ev.stopPropagation();
				insertAtEnd(colon.matches[colon.select].token);
				colon.active = false;
				break;
			case "ArrowUp":
			case "ArrowDown": {
				const direction = ev.key === "ArrowUp" ? "up" : "down";

				if (colon.active) {
					ev.preventDefault();

					if (direction === "up") {
						colon.select = Math.max(0, colon.select - 1);
					} else {
						colon.select = Math.min(colon.matches.length - 1, colon.select + 1);
					}

					const selectedItem = colonList.value?.children.item(colon.select);
					if (selectedItem) {
						selectedItem.scrollIntoView({
							block: "nearest",
							inline: "nearest",
						});
					}
				} else if (inputEl.value) {
					ev.preventDefault();

					if (direction === "up") {
						history.index = inputEl.value.textContent?.length
							? Math.min(history.messages.length - 1, history.index + 1)
							: 0;
					} else {
						history.index = Math.max(0, history.index - 1);
					}

					inputEl.value.textContent = history.messages[history.index];
				}

				break;
			}
			default:
				history.index = 0;
				break;
		}
	},
	{
		capture: true,
	},
);

watchEffect(() => {
	inputEl.value = (document.getElementById("message-input") as HTMLDivElement) ?? null;
	footerEl.value = (document.getElementById("chatroom-footer") as HTMLDivElement) ?? null;
});

useMutationObserver(
	inputEl.value,
	(records) => {
		for (const rec of records) {
			if (!(rec.target instanceof HTMLElement)) continue;
			if (rec.type !== "attributes" || rec.attributeName !== "contenteditable") continue;

			const isEditable = rec.target.getAttribute("contenteditable") === "true";
			if (!isEditable) {
				rec.target.setAttribute("contenteditable", "true");
				rec.target.focus();
			}
		}
	},
	{
		attributeFilter: ["contenteditable"],
		attributes: true,
	},
);

defineExpose({
	insertAtEnd,
	handleMessageSend,
});
</script>

<style lang="scss" scoped>
.seventv-autocomplete-list {
	display: grid;
	background-color: var(--seventv-background-transparent-1);
	backdrop-filter: blur(2rem);
	border-radius: 0.25rem;
	padding: 0.5rem;
	max-height: 16em;
	overflow: auto;

	// add border between each item
	& > * + * {
		border-top: 1px solid var(--seventv-input-border);
	}
}

.seventv-autocomplete-item {
	display: grid;
	grid-template-columns: 4rem 1fr;
	align-items: center;
	align-content: center;
	row-gap: 1em;
	column-gap: 0.5em;
	padding: 0.5em 0;

	&:hover {
		cursor: pointer;
		background-color: var(--seventv-background-transparent-2);
	}

	&[selected="true"] {
		outline: 2px solid var(--seventv-primary);
	}
}
</style>
