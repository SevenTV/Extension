<template>
	<div v-if="emotes.length" ref="containerEl" class="seventv-emote-set-container">
		<div class="seventv-set-header">
			<div class="seventv-set-header-icon">
				<img v-if="es.owner && es.owner.avatar_url" :src="es.owner.avatar_url" />
				<Logo v-else class="logo" :provider="es.provider" />
			</div>
			{{ es.name }}
		</div>

		<div v-if="observing" v-element-lifecycle="onObserve" class="seventv-emote-set">
			<div
				v-for="ae of emotes"
				:key="ae.id"
				class="seventv-emote-container"
				:class="{
					[`ratio-${determineRatio(ae)}`]: true,
					'seventv-emote-disabled': isEmoteDisabled(es, ae),
				}"
				:load-state="loaded[ae.id]"
				:set-id="es.id"
				:emote-id="ae.id"
				@click="!isEmoteDisabled(es, ae) && emit('emote-clicked', ae)"
			>
				<template v-if="loaded[ae.id]">
					<Emote :emote="ae" :unload="!loaded[ae.id]" />
				</template>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watchEffect } from "vue";
import { until, useTimeout } from "@vueuse/core";
import { debounceFn } from "@/common/Async";
import { determineRatio } from "@/common/Image";
import Logo from "@/assets/svg/logos/Logo.vue";
import { useEmoteMenuContext } from "./EmoteMenuContext";
import {
	ElementLifecycle,
	ElementLifecycleDirective as vElementLifecycle,
} from "@/directive/ElementLifecycleDirective";
import Emote from "../chat/components/message/Emote.vue";

const props = defineProps<{
	es: SevenTV.EmoteSet;
}>();

const emit = defineEmits<{
	(e: "emote-clicked", ae: SevenTV.ActiveEmote): void;
	(e: "emotes-updated", emotes: SevenTV.ActiveEmote[]): void;
}>();

const ctx = useEmoteMenuContext();
const emotes = ref<SevenTV.ActiveEmote[]>([]);
const containerEl = ref<HTMLElement>();
const observing = ref(false);

// Filter active emotes with query
const filterEmotes = debounceFn((filter = "") => {
	const x = [] as SevenTV.ActiveEmote[];

	for (const e of props.es.emotes) {
		if (filter && !e.name.toLowerCase().includes(filter.toLowerCase())) {
			continue;
		}

		x.push(e);
	}

	x.sort((a, b) => {
		const ra = determineRatio(a);
		const rb = determineRatio(b);
		return ra == rb ? a.name.localeCompare(b.name) : ra > rb ? 1 : -1;
	});

	emotes.value = x;
	emit("emotes-updated", x);
}, 250);

function isEmoteDisabled(set: SevenTV.EmoteSet, ae: SevenTV.ActiveEmote) {
	return set.scope === "PERSONAL" && ae.data && ae.data.state && !ae.data.state.includes("PERSONAL");
}

watchEffect(() => filterEmotes(ctx.filter));

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

			// if the element is intersecting, wait 350ms before loading it
			if (entry.isIntersecting && !loaded[eid]) {
				const previouslyLoaded = loaded[eid] === -1;
				loaded[eid] = 0;

				if (shouldDebounceLoading && !previouslyLoaded && debounceCards.value) {
					await until(useTimeout(350)).toBeTruthy();
				}
			}

			// if the element was intersecting, but not anymore, delete it from the loaded map
			if (loaded[eid] === 0 && !entry.isIntersecting) {
				delete loaded[eid];
				return;
			}

			// if the element has been intersecting for 350ms, load it
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
.seventv-emote-set-container {
	position: relative;
}

.seventv-set-header-icon {
	font-size: 2rem;
	max-width: 2rem;
	max-height: 2rem;
	border-radius: 0.5rem;
	margin-right: 1rem;
	overflow: clip;
}

.seventv-emote-set {
	display: inline-flex;
	flex-wrap: wrap;
	margin: 0.5rem;
}

.seventv-set-header {
	height: 3rem;
	padding: 0.5rem 1.25rem;
	position: sticky;
	top: -1px;
	display: flex;
	background: var(--seventv-background-transparent-2);
}
.seventv-emote-container {
	display: grid;
	background: hsla(0deg, 0%, 50%, 6%);
	border-radius: 0.5rem;
	height: 4rem;
	margin: 0.25rem;
	cursor: pointer;

	&:hover {
		background: hsla(0deg, 0%, 50%, 32%);
	}

	&[load-state="0"] {
		background: hsla(0deg, 0%, 50%, 6%);
		animation: emote-loader 1s linear infinite;
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

	&.seventv-emote-disabled {
		cursor: not-allowed;
		filter: grayscale(100%);
		opacity: 0.5;

		> :first-child {
			pointer-events: none;
		}
	}
}

.ratio-1 {
	width: 4rem;
}

.ratio-2 {
	width: 6.25rem;
}

.ratio-3 {
	width: 8.5rem;
}

.ratio-4 {
	width: 13rem;
}
</style>
