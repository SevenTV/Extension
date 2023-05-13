<template>
	<template v-for="(box, index) of containers" :key="index">
		<Teleport :to="box">
			<template v-for="(token, i) of tokens" :key="i">
				<span v-if="typeof token === 'string'"> {{ token }}</span>
				<span v-else-if="IsEmoteToken(token)">
					<Emote class="seventv-emote-token" :emote="token.content.emote" format="WEBP" />
				</span>
			</template>
		</Teleport>
	</template>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { ref } from "vue";
import { onUnmounted } from "vue";
import { tokenize } from "@/common/Tokenize";
import { AnyToken } from "@/common/chat/ChatMessage";
import { IsEmoteToken } from "@/common/type-predicates/MessageTokens";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import Emote from "@/site/twitch.tv/modules/chat/components/message/Emote.vue";

type MessageTokenOrText = AnyToken | string;

export interface ChatMessageBinding {
	id: string;
	authorID: string;
	authorName: string;
	texts: HTMLSpanElement[];
}

const props = defineProps<{
	bind: ChatMessageBinding;
}>();

const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);

const containers = ref<HTMLElement[]>([]);
const tokens = ref<MessageTokenOrText[]>([]);

// Process kick's text entries into a containerized token
function process(): void {
	for (const el of props.bind.texts) {
		const text = el.textContent ?? "";

		const newTokens = tokenize({
			body: text,
			chatterMap: {},
			emoteMap: emotes.active,
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

		tokens.value = result;

		const tokenEl = document.createElement("seventv-container");
		tokenEl.classList.add("seventv-text-token");

		el.after(tokenEl);
		el.style.display = "none"; // to allow for graceful recovery, we only hide the original token

		containers.value.push(tokenEl);
	}
}

onMounted(process);

onUnmounted(() => {
	for (const el of containers.value) {
		el.remove(); // remove our custom containers
	}

	for (const el of props.bind.texts) {
		el.style.display = "initial"; // restore the original tokens
	}
});
</script>

<style scoped lang="scss">
.seventv-emote-token {
	display: inline-grid;
	vertical-align: middle;
	margin: var(--seventv-emote-margin);
	margin-left: 0 !important;
	margin-right: 0 !important;
}
</style>
