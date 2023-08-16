<template>
	<div
		v-if="ephemeral || emotes.length"
		ref="containerEl"
		class="seventv-emote-set-container"
		:collapsed="collapsed"
		:ephemeral="ephemeral"
	>
		<div class="seventv-set-header">
			<div class="seventv-set-header-icon">
				<img v-if="es.owner && es.owner.avatar_url" :src="es.owner.avatar_url" />
				<Logo v-else class="logo" :provider="es.provider" />
			</div>

			<span class="seventv-set-name">{{ getLocaleName() }}</span>
			<div class="seventv-set-chevron" @click="toggleCollapsed">
				<DropdownIcon v-if="!ephemeral" />
				<CloseIcon v-else />
			</div>
		</div>

		<div v-if="observing" v-element-lifecycle="onObserve" class="seventv-emote-set">
			<div
				v-for="ae of emotes"
				:key="ae.id"
				class="seventv-emote-container"
				:disabled="isEmoteDisabled(es, ae)"
				:ratio="determineRatio(ae)"
				:load-state="loaded[ae.id]"
				:set-id="es.id"
				:emote-id="ae.id"
				:zero-width="(ae.flags || 0 & 256) !== 0"
				:favorite="favorites?.has(ae.id) && es.id !== 'FAVORITE'"
				tabindex="0"
				@click="onInsertEmote(ae)"
				@keydown.enter.prevent="onInsertEmote(ae)"
			>
				<template v-if="loaded[ae.id]">
					<Emote :emote="ae" :unload="!loaded[ae.id]" />
				</template>
			</div>
		</div>

		<slot />
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { onKeyDown, until, useMagicKeys, useTimeout } from "@vueuse/core";
import { debounceFn } from "@/common/Async";
import { determineRatio } from "@/common/Image";
import { useConfig } from "@/composable/useSettings";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import DropdownIcon from "@/assets/svg/icons/DropdownIcon.vue";
import Logo from "@/assets/svg/logos/Logo.vue";
import { useEmoteMenuContext } from "./EmoteMenuContext";
import Emote from "@/app/chat/Emote.vue";
import {
	ElementLifecycle,
	ElementLifecycleDirective as vElementLifecycle,
} from "@/directive/ElementLifecycleDirective";

const props = defineProps<{
	es: SevenTV.EmoteSet;
	ephemeral?: boolean;
}>();

const emit = defineEmits<{
	(e: "emote-clicked", ae: SevenTV.ActiveEmote): void;
	(e: "emotes-updated", emotes: SevenTV.ActiveEmote[]): void;
}>();

const { t, te } = useI18n();

const ctx = useEmoteMenuContext();
const emotes = ref<SevenTV.ActiveEmote[]>([]);
const containerEl = ref<HTMLElement>();
const observing = ref(false);
const collapsedSets = useConfig<Set<string>>("ui.emote_menu.collapsed_sets");
const favorites = useConfig<Set<string>>("ui.emote_menu.favorites");
const usage = useConfig<Map<string, number>>("ui.emote_menu.usage");

const { alt } = useMagicKeys();
const collapsed = ref(isCollapsed());

function sortCase(ae: SevenTV.ActiveEmote): number {
	if (props.es.id === "USAGE") {
		// special case for most used emotes
		// we must rank them by usage count
		const use = usage.value.get(ae.id) ?? 0;
		return use - use * 2 || 0;
	}

	let n = determineRatio(ae);

	if ((ae.flags || 0 & 256) !== 0) n -= 0.5;

	return n;
}

// Filter active emotes with query
const filterEmotes = debounceFn((filter = "") => {
	const x = [] as SevenTV.ActiveEmote[];

	if (props.es.provider && !props.es.emotes.length) {
		return;
	}

	for (const e of props.es.emotes) {
		if (filter && !e.name.toLowerCase().includes(filter.toLowerCase())) {
			continue;
		}

		x.push(e);
	}

	x.sort((a, b) => {
		const na = sortCase(a);
		const nb = sortCase(b);

		return na == nb ? a.name.localeCompare(b.name) : na > nb ? 1 : -1;
	});

	emotes.value = x;
	emit("emotes-updated", x);
}, 25);

function isEmoteDisabled(set: SevenTV.EmoteSet, ae: SevenTV.ActiveEmote) {
	return set.scope === "PERSONAL" && ae.data && ae.data.state && !ae.data.state.includes("PERSONAL");
}

function onInsertEmote(ae: SevenTV.ActiveEmote): void {
	if (isEmoteDisabled(props.es, ae)) return;
	if (alt.value) {
		if (favorites.value.has(ae.id)) {
			favorites.value.delete(ae.id);
		} else {
			favorites.value.add(ae.id);
		}

		favorites.value = new Set(favorites.value);
		return;
	}

	emit("emote-clicked", ae);
}

function getLocaleName(): string {
	const k = `emote_menu.sets.${props.es.name}`;
	return te(k) ? t(k) : props.es.name;
}

onKeyDown("Escape", () => {
	ctx.open = false;
});

watch(
	() => props.es.emotes,
	() => {
		filterEmotes(ctx.filter);
	},
);
watchEffect(() => {
	filterEmotes(ctx.filter);
});

// IntersectionObserver to hide out-of-view emotes and throttle loading to view
const loaded = reactive<Record<string, number>>({});
const debounceCards = ref(false);
const shouldDebounceLoading = props.es.provider !== "EMOJI";

let observer: IntersectionObserver;
function setupObserver() {
	if (observer) return;

	observer = new IntersectionObserver((entries) => {
		entries.forEach(async (entry) => {
			const eid = entry.target.getAttribute("emote-id") as string;

			// if the element is intersecting, wait a bit before loading it
			if (entry.isIntersecting && !loaded[eid]) {
				const previouslyLoaded = loaded[eid] === -1;
				loaded[eid] = 0;

				if (shouldDebounceLoading && !previouslyLoaded && debounceCards.value) {
					await until(useTimeout(100)).toBeTruthy();
				}
			}

			// if the element was intersecting, but not anymore, delete it from the loaded map
			if (loaded[eid] === 0 && !entry.isIntersecting) {
				delete loaded[eid];
				return;
			}

			// if the element has been intersecting for enough time, load it
			if (entry.isIntersecting && loaded[eid] === 0) {
				loaded[eid] = 1;
				return;
			}

			// if the element is not intersecting anymore, delete it from the loaded map
			if (!entry.isIntersecting && loaded[eid] >= 0) {
				loaded[eid] = loaded[eid] === 1 ? -1 : 0;
			}
		});

		debounceCards.value = true;
	});

	observing.value = true;
}

function onObserve(lifecycle: ElementLifecycle, el: HTMLElement) {
	if (!observer) return;

	for (let i = 0; i < el.children.length; i++) {
		const child = el.children.item(i) as HTMLElement;
		if (!child) continue;

		const eid = child.getAttribute("emote-id");
		if (!eid || loaded[eid]) continue;

		if (lifecycle === "mounted" || lifecycle === "updated") {
			observer.observe(child);
		} else {
			observer.unobserve(child);
		}
	}
}

function isCollapsed(): boolean {
	if (!collapsedSets.value) return false;

	return collapsedSets.value.has(props.es.id);
}

function toggleCollapsed(): void {
	if (!collapsedSets.value) return;
	if (isCollapsed()) {
		collapsedSets.value.delete(props.es.id);
		collapsed.value = false;
	} else {
		collapsedSets.value.add(props.es.id);
		collapsed.value = true;
	}

	collapsedSets.value = new Set(collapsedSets.value);
}

onMounted(() => {
	setupObserver();
});

onBeforeUnmount(() => {
	if (observer) observer.disconnect();
});

defineExpose({
	containerEl,
});
</script>

<style scoped lang="scss">
.seventv-emote-set {
	display: flex;
	flex-wrap: wrap;
	margin: 0 0.5em;
}

.seventv-set-header {
	display: grid;

	// icon, name, then at the end the chevron
	grid-template-columns: auto 1fr 1.5em;
	column-gap: 0.5em;
	height: 3em;
	padding: 0.5em 1.25em;
	position: sticky;
	top: -1px;
	background: var(--seventv-background-transparent-2);

	.seventv-set-chevron {
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2em;
		height: 2em;
		border-radius: 0.25em;

		> svg {
			transition: transform 0.25s ease;
			transform: rotate(180deg);
		}

		&:hover {
			background-color: hsla(0deg, 0%, 30%, 32%);
		}
	}

	.seventv-set-name {
		display: block;
		font-size: 1.5em;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.seventv-set-header-icon {
		max-width: 2em;
		max-height: 2em;
		border-radius: 0.5em;
		overflow: clip;

		svg {
			font-size: 2em;
		}
	}
}

.seventv-emote-set-container {
	position: relative;

	&[collapsed="true"] {
		.seventv-emote-set {
			display: none;
		}

		.seventv-set-header > .seventv-set-chevron > svg {
			transform: rotate(90deg);
		}

		&[ephemeral="true"] {
			display: none;
		}
	}
}

.seventv-emote-container {
	display: grid;
	background: hsla(0deg, 0%, 50%, 6%);
	border-radius: 0.25rem;
	height: 4em;
	margin: 0.25em;
	cursor: pointer;

	&:hover {
		background: hsla(0deg, 0%, 50%, 32%);
	}

	&[load-state="0"] {
		background: hsla(0deg, 0%, 50%, 6%);
		animation: emote-loader 0.5s linear infinite;
	}

	@keyframes emote-loader {
		0% {
			background: hsla(0deg, 0%, 50%, 6%);
		}

		50% {
			background: hsla(0deg, 0%, 50%, 12%);
		}

		100% {
			background: hsla(0deg, 0%, 50%, 6%);
		}
	}

	&[zero-width="true"] {
		border: 0.1rem solid rgb(220, 170, 50);
	}

	&[favorite="true"] {
		border: 0.1rem solid rgb(50, 200, 250);
	}

	&[disabled="true"] {
		cursor: not-allowed;
		filter: grayscale(100%);
		opacity: 0.5;

		> :first-child {
			pointer-events: none;
		}
	}

	// The extra width is to compensate for the spacing
	// between the emotes so they tile correctly.

	&[ratio="1"] {
		width: 4em;
	}

	&[ratio="2"] {
		width: calc(4em * 1.5 + 0.25em);
	}

	&[ratio="3"] {
		width: calc(4em * 2 + 0.5em);
	}

	&[ratio="4"] {
		width: calc(4em * 3 + 1em);
	}
}
</style>
