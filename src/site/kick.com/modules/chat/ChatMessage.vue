<template>
	<template v-for="(container, index) of contentContainers" :key="index">
		<Teleport v-if="contentContainerStates[index]" :to="container">
			<template v-for="(token, i) of tokens.get(container) ?? []" :key="i">
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
	</template>

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
import { computed, reactive, ref, watch } from "vue";
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
	messageSegments: string[];
	rawMessageContent: string;
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
const contentContainers = ref<HTMLElement[]>([]);
const contentContainerStates = ref<boolean[]>([]);
const tokens = reactive(new WeakMap<HTMLElement, AnyToken[]>());

const shouldRenderPaints = useConfig<boolean>("vanity.nametag_paints");
const shouldRenderBadges = useConfig<boolean>("vanity.7tv_Badges");
const activeEmoteKey = computed(() =>
	Object.values(emotes.active)
		.map((emote) => `${emote.name}:${emote.id}`)
		.sort()
		.join("\0"),
);
const activeSegments = computed(() => {
	const extractedSegments = props.bind.messageSegments.filter((segment) => segment.length > 0);
	return extractedSegments.length > 0 ? extractedSegments : [props.bind.rawMessageContent];
});

// Listen for click events
useEventListener(props.bind.userCardTriggerEl, "click", () => {
	emit("open-card", props.bind);
});

function process(): void {
	contentContainers.value.forEach((container) => container.remove());
	contentContainers.value = [];
	contentContainerStates.value = [];

	const sourceSegments = activeSegments.value;
	const anchors =
		sourceSegments.length === props.bind.originalContentEls.length
			? props.bind.originalContentEls
			: [props.bind.originalContentEls.at(-1)].filter((el): el is HTMLElement => !!el);

	sourceSegments.forEach((segment, index) => {
		const anchor = anchors[index];
		if (!anchor) return;

		const container = document.createElement("seventv-container");
		container.classList.add("seventv-text-token");

		tokens.set(
			container,
			tokenize({
				body: segment,
				chatterMap: {},
				emoteMap: emotes.active,
				localEmoteMap: { ...cosmetics.emotes },
				isKick: true,
			}),
		);

		anchor.after(container);
		contentContainers.value.push(container);
		contentContainerStates.value.push(true);
	});

	for (const el of props.bind.originalContentEls) {
		el.style.display = "none";
	}
}

watch([activeSegments, cosmetics, activeEmoteKey], process, { immediate: true });
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
	contentContainers.value.forEach((container) => container.remove());
	contentContainers.value = [];
	contentContainerStates.value = [];

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
