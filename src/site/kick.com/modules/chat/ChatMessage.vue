<template>
	<Teleport v-for="(box, index) of containers" :key="`${index}`" :to="box">
		<template v-for="(token, i) of tokens.get(box)">
			<span v-if="typeof token === 'string'" :key="`${index}-${i}`" class="seventv-text-token">
				<template v-for="(part, j) in splitToken(token)">
					<span v-if="IsKickEmote(part)" :key="j">
						<span class="kick-emote-token">
							<img :src="getKickEmoteUrl(part)" alt="Kick Emote" />
						</span>
					</span>
					<span v-else :key="`${index}-${j}-else`">
						{{ part }}
					</span>
				</template>
			</span>
			<span v-else-if="IsEmoteToken(token)" :key="`${i}-else`">
				<Emote
					class="seventv-emote-token"
					:emote="token.content.emote"
					:overlaid="token.content.overlaid"
					format="WEBP"
				/>
			</span>
		</template>
	</Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, watchEffect } from "vue";
import { ref } from "vue";
import { onUnmounted } from "vue";
import { useEventListener } from "@vueuse/core";
import { tokenize } from "@/common/Tokenize";
import { AnyToken } from "@/common/chat/ChatMessage";
import { IsEmoteToken } from "@/common/type-predicates/MessageTokens";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useCosmetics } from "@/composable/useCosmetics";
import Emote from "@/app/chat/Emote.vue";
import { updateElementStyles } from "@/directive/TextPaintDirective";

type MessageTokenOrText = AnyToken | string;

export interface ChatMessageBinding {
	id: string;
	authorID: string;
	authorName: string;
	texts: HTMLSpanElement[];
	usernameEl: HTMLSpanElement;
	el: HTMLDivElement;
}

const props = defineProps<{
	bind: ChatMessageBinding;
}>();

const emit = defineEmits<{
	(e: "open-card", bind: ChatMessageBinding): void;
	(e: "render"): void;
}>();

const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);
let cosmetics;

const badgeContainer = document.createElement("seventv-container");

const containers = ref<HTMLElement[]>([]);
const tokens = reactive<WeakMap<HTMLElement, MessageTokenOrText[]>>(new WeakMap());

// Listen for click events
useEventListener(props.bind.usernameEl.parentElement, "click", () => {
	emit("open-card", props.bind);
});

function splitToken(token: string): string[] {
	const parts = [];
	let lastIndex = 0;
	const regex = /\[emote:\d+:[^\]]+\]/g;
	let match;
	while ((match = regex.exec(token)) !== null) {
		if (lastIndex < match.index) {
			parts.push(token.substring(lastIndex, match.index));
		}
		parts.push(match[0]);
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < token.length) {
		parts.push(token.substring(lastIndex));
	}
	return parts;
}

function extractTextWithKickEmotes(el: HTMLElement): string {
	let result = "";
	el.childNodes.forEach((node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			result += node.textContent || "";
		} else if (node instanceof HTMLElement) {
			if (node.hasAttribute("data-emote-id") && node.hasAttribute("data-emote-name")) {
				const emoteId = node.getAttribute("data-emote-id");
				const emoteName = node.getAttribute("data-emote-name");
				result += `[emote:${emoteId}:${emoteName}]`;
			} else {
				result += extractTextWithKickEmotes(node);
			}
		}
	});
	return result;
}

function IsKickEmote(token: string): boolean {
	// Check if the token matches the Kick emote format
	return token.startsWith("[emote:") && token.endsWith("]");
}

function getKickEmoteUrl(token: string): string {
	const match = token.match(/\[emote:(\d+):([^\]]+)\]/);
	if (match) {
		const emoteId = match[1];
		return `https://files.kick.com/emotes/${emoteId}/fullsize`;
	}
	return "";
}

// Process kick's text entries into a containerized token
function process(): void {
	cosmetics = useCosmetics(props.bind.authorID);
	if (cosmetics.paints.size) {
		updateElementStyles(props.bind.usernameEl, Array.from(cosmetics.paints.values())[0].id);
	}
	containers.value.length = 0;
	for (const el of props.bind.texts) {
		//const message = props?.children?.props?.content ?? "";
		const text = extractTextWithKickEmotes(el as HTMLElement);
		const newTokens = tokenize({
			body: text,
			chatterMap: {},
			emoteMap: emotes.active,
			localEmoteMap: { ...cosmetics.emotes },
		});

		const result = [] as MessageTokenOrText[];

		let lastOffset = 0;
		for (const tok of newTokens) {
			const start = tok.range[0];
			const end = tok.range[1];

			const before = text.substring(lastOffset, start);
			if (before) {
				result.push(before);
			}

			result.push(tok);

			lastOffset = end + 1;
		}

		const after = text.substring(lastOffset);
		if (after) {
			result.push(after);
		}

		const tokenEl = document.createElement("seventv-container");
		tokenEl.classList.add("seventv-text-token");
		el.after(tokenEl);
		el.style.display = "none";

		containers.value.push(tokenEl);
		tokens.set(tokenEl, result);
	}

	nextTick(() => emit("render"));
}

//watch(cosmetics, process);
watchEffect(process);

onMounted(process);

onUnmounted(() => {
	for (const el of containers.value) {
		el.remove(); // remove our custom containers
	}

	for (const el of props.bind.texts) {
		el.style.display = "initial"; // restore the original tokens
	}

	badgeContainer.remove();
});
</script>

<style scoped lang="scss">
.seventv-emote-token {
	display: inline-grid !important;
	vertical-align: middle;
	margin: var(--seventv-emote-margin);
	margin-left: 0 !important;
	margin-right: 0 !important;

	> :deep(svg) {
		max-width: 1.5em !important;
		max-height: 1.5em !important;
	}

	:deep(img) {
		max-height: 1.75rem !important;
	}
}

.seventv-text-token {
	word-break: break-word;
}

.seventv-badge-list {
	display: inline-grid;
	vertical-align: middle;
	margin-right: 0.25rem;
}

.kick-emote-token {
	width: 30px;
	height: 20px;
	display: inline-block;
	position: relative;
}
</style>
