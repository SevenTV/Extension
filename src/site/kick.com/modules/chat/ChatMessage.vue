<template>
	<Teleport v-if="contentContainerMounted" :to="contentContainer">
		<template v-for="(token, i) of tokens" :key="i">
			<span v-if="IsTextToken(token)" class="seventv-text-token">
				{{ token.content }}
			</span>
			<span v-else-if="IsLinkToken(token)">
				<a :href="token.content.url" target="_blank" class="seventv-links" rel="noopener noreferrer">{{
					token.content.url
				}}</a>
			</span>
			<span v-else-if="IsEmoteToken(token)">
				<Emote
					class="seventv-emote-token"
					:emote="token.content.emote"
					:overlaid="token.content.overlaid"
					format="WEBP"
				/>
			</span>
		</template>
	</Teleport>

	<Teleport v-if="shouldRenderBadges" :to="badgeContainer">
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
import { ref, watch } from "vue";
import { onUnmounted } from "vue";
import { useEventListener } from "@vueuse/core";
import { tokenize } from "@/common/Tokenize";
import { AnyToken } from "@/common/chat/ChatMessage";
import { IsEmoteToken, IsLinkToken, IsTextToken } from "@/common/type-predicates/MessageTokens";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useCosmetics } from "@/composable/useCosmetics";
import { useConfig } from "@/composable/useSettings";
import Badge from "@/app/chat/Badge.vue";
import Emote from "@/app/chat/Emote.vue";
import { updateElementStyles } from "@/directive/TextPaintDirective";

export interface ChatMessageBinding {
	id: string;
	authorID: string;
	authorName: string;
	messageContent: string;
	originalContentEls: HTMLElement[];
	userCardTriggerEl: HTMLElement;
	badgeAnchorEl: HTMLElement;
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
const contentContainer = document.createElement("seventv-container");
contentContainer.classList.add("seventv-text-token");
const tokens = ref<AnyToken[]>([]);
const contentContainerMounted = ref(false);

const shouldRenderPaints = useConfig<boolean>("vanity.nametag_paints");
const shouldRenderBadges = useConfig<boolean>("vanity.7tv_Badges");

// Listen for click events
useEventListener(props.bind.userCardTriggerEl, "click", () => {
	emit("open-card", props.bind);
});

// Replace kick's original message body with a single tokenized container.
function process(): void {
	tokens.value = tokenize({
		body: props.bind.messageContent,
		chatterMap: {},
		emoteMap: emotes.active,
		localEmoteMap: { ...cosmetics.emotes },
		isKick: true,
	});

	const anchor = props.bind.originalContentEls.at(-1);
	if (anchor && !contentContainer.isConnected) {
		anchor.after(contentContainer);
		contentContainerMounted.value = true;
	}

	for (const el of props.bind.originalContentEls) {
		el.style.display = "none";
	}
}

watch(() => props.bind.messageContent, process, { immediate: true });
watch(cosmetics, process);
watch(
	() => props.bind.badgeAnchorEl,
	(el) => {
		if (!el.contains(badgeContainer)) el.insertAdjacentElement("beforebegin", badgeContainer);
	},
	{ immediate: true },
);

watch(
	[() => props.bind.userCardTriggerEl, cosmetics, shouldRenderPaints],
	([el, c, s]) => updateElementStyles(el, s && c.paints.size ? Array.from(c.paints.values())[0].id : null),
	{ immediate: true },
);

onUnmounted(() => {
	contentContainer.remove();
	contentContainerMounted.value = false;

	for (const el of props.bind.originalContentEls) {
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

.seventv-links {
	text-decoration-line: underline;
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
