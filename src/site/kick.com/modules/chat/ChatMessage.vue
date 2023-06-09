<template>
	<template v-for="(box, index) of containers" :key="index">
		<Teleport :to="box">
			<template v-for="(token, i) of tokens.get(box)" :key="i">
				<span v-if="typeof token === 'string'"> {{ token }}</span>
				<span v-else-if="IsEmoteToken(token)">
					<Emote class="seventv-emote-token" :emote="token.content.emote" format="WEBP" />
				</span>
			</template>
		</Teleport>
	</template>

	<Teleport :to="badgeContainer">
		<span v-if="cosmetics.badges.size" class="seventv-badge-list">
			<Badge
				v-for="[id, badge] of cosmetics.badges"
				:key="id"
				:badge="badge"
				type="app"
				:alt="badge.data.tooltip"
			/>
		</span>
	</Teleport>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch, watchEffect } from "vue";
import { ref } from "vue";
import { onUnmounted } from "vue";
import { useEventListener } from "@vueuse/core";
import { tokenize } from "@/common/Tokenize";
import { AnyToken } from "@/common/chat/ChatMessage";
import { IsEmoteToken } from "@/common/type-predicates/MessageTokens";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useCosmetics } from "@/composable/useCosmetics";
import Badge from "@/app/chat/Badge.vue";
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
}>();

const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);
const cosmetics = useCosmetics(props.bind.authorID);

const badgeContainer = document.createElement("seventv-container");

const containers = ref<HTMLElement[]>([]);
const tokens = reactive<WeakMap<HTMLElement, MessageTokenOrText[]>>(new WeakMap());

// Listen for click events
useEventListener(props.bind.usernameEl.parentElement, "click", () => {
	emit("open-card", props.bind);
});

// Process kick's text entries into a containerized token
function process(): void {
	props.bind.usernameEl.insertAdjacentElement("beforebegin", badgeContainer);

	if (cosmetics.paints.size) {
		updateElementStyles(props.bind.usernameEl, Array.from(cosmetics.paints.values())[0].id);
	}

	containers.value.length = 0;
	for (const el of props.bind.texts) {
		const text = el.textContent ?? "";

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
		el.style.display = "none"; // to allow for graceful recovery, we only hide the original token

		containers.value.push(tokenEl);
		tokens.set(tokenEl, result);
	}
}

watch(cosmetics, process);
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
}

.seventv-badge-list {
	display: inline-grid;
	vertical-align: middle;
	margin-right: 0.25rem;
}
</style>
