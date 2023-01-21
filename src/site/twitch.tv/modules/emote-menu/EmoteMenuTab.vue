<template>
	<UiScrollable class="scroll-area">
		<div class="emote-area">
			<template v-for="es of sortedSets" :key="es.id">
				<div v-if="filteredEmotes[es.id]?.length" :ref="'es-' + es.id" class="emote-set-container">
					<div class="set-header">
						<div class="set-header-icon">
							<img v-if="es.owner && es.owner.avatar_url" :src="es.owner.avatar_url" />
							<Logo v-else class="logo" :provider="es.provider" />
						</div>
						{{ es.name }}
					</div>
					<div class="emote-set">
						<div
							v-for="ae of filteredEmotes[es.id]"
							:key="ae.id"
							:ref="(el) => setCardRef(el as HTMLElement)"
							class="emote-container"
							:class="`ratio-${determineRatio(ae)}`"
							:visible="loaded[ae.id]"
							:emote-id="ae.id"
							@click="emit('emote-clicked', ae)"
						>
							<Emote :emote="ae" :unload="!loaded[ae.id]" />
						</div>
					</div>
				</div>
			</template>
		</div>
	</UiScrollable>
	<div class="sidebar">
		<template v-for="es in sortedSets" :key="es.id">
			<div
				v-if="es.emotes.length"
				class="set-sidebar-icon-container"
				:selected="selectedSet == es.id"
				@click="select(es.id, $refs['es-' + es.id] as HTMLDivElement[])"
			>
				<div class="set-sidebar-icon">
					<img v-if="es.owner && es.owner.avatar_url" :src="es.owner.avatar_url" />
					<Logo v-else class="logo" :provider="es.provider" />
				</div>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, ref, toRaw } from "vue";
import { until, useTimeout, watchDebounced, watchThrottled } from "@vueuse/core";
import { useChatContext } from "@/composable/chat/useChatContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { determineRatio } from "@/site/twitch.tv/modules/emote-menu/EmoteMenuBackend";
import Logo from "@/assets/svg/logos/Logo.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import Emote from "../chat/components/message/Emote.vue";

const props = defineProps<{
	provider: SevenTV.Provider;
	filter?: string;
}>();

const emit = defineEmits<{
	(event: "emote-clicked", emote: SevenTV.ActiveEmote): void;
	(event: "provider-visible", state: boolean): void;
}>();

const context = useChatContext();
const emotes = useChatEmotes();
const selectedSet = ref("");

// The source emote sets from this emote provider
const sets = emotes.byProvider(props.provider);

const sortedSets = ref([] as SevenTV.EmoteSet[]);
const filteredEmotes = ref<Record<string, SevenTV.ActiveEmote[]>>({});

// Select an Emote Set to jump-scroll to
function select(setID: string, els: HTMLDivElement[] | null | undefined) {
	if (!els || !els.length) return;
	const el = els[0];

	selectedSet.value = setID;
	el.scrollIntoView({ behavior: "auto" });
}

function sortCase(es: SevenTV.EmoteSet) {
	if (es.scope === "GLOBAL") return 1;

	if (context.channel && context.channel.id && es.owner && es.owner.id === context.channel.id) return -1;
	if (es.flags & 4) return -2;
	return 0;
}

function sortFn(a: SevenTV.EmoteSet, b: SevenTV.EmoteSet) {
	const c1 = sortCase(a);
	const c2 = sortCase(b);

	return c1 == c2 ? a.name.localeCompare(b.name) : c1 > c2 ? 1 : -1;
}

// Filter active emotes with query
function filterEmotes(filter: string) {
	const x = {} as Record<string, SevenTV.ActiveEmote[]>;

	let total = 0;
	for (const set of sortedSets.value) {
		if (!filter) {
			x[set.id] = set.emotes;

			total += set.emotes.length;
			continue;
		}

		const res = set.emotes.filter((e) => e.name.toLowerCase().includes(filter!.toLowerCase()));
		x[set.id] = res;
		total += res.length;
	}

	filteredEmotes.value = x;
	emit("provider-visible", !!total);
}

// Watch for changes to the emote sets and perform sorting operations
watchDebounced(
	sets,
	() => {
		const ary = Object.values(structuredClone(toRaw(sets.value))) as SevenTV.EmoteSet[];

		if (props.provider === "TWITCH") {
			const res = ary.reduce((prev, cur) => {
				const p = prev[cur.name];
				if (p) {
					p.emotes.push(...cur.emotes);
				} else {
					prev[cur.name] = cur;
				}
				return prev;
			}, {} as Record<string, SevenTV.EmoteSet>);

			ary.splice(0, ary.length, ...Object.values(res));
		}

		for (const set of ary) {
			set.emotes.sort((a, b) => {
				const ra = determineRatio(a);
				const rb = determineRatio(b);
				return ra == rb ? a.name.localeCompare(b.name) : ra > rb ? 1 : -1;
			});
		}

		// Sort emote sets
		sortedSets.value.splice(0, sortedSets.value.length, ...ary.sort(sortFn));
		filterEmotes(props.filter ?? "");
	},
	{ debounce: 150, immediate: true },
);

// Listen for user search query
watchThrottled(props, ({ filter }) => filterEmotes(filter ?? ""), { throttle: 250 });

// IntersectionObserver to hide out-of-view emotes and throttle loading to view
const cards = [] as HTMLElement[];
const loaded = reactive<Record<string, number>>({});
const observer = new IntersectionObserver((entries) => {
	entries.forEach(async (entry) => {
		const eid = entry.target.getAttribute("emote-id") as string;

		// if the element is intersecting, wait 350ms before loading it
		if (entry.isIntersecting && !loaded[eid]) {
			const previouslyLoaded = loaded[eid] === -1;
			loaded[eid] = 0;
			if (!previouslyLoaded) await until(useTimeout(350)).toBeTruthy();
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
});

// gather all card elements and observe them
const setCardRef = (el: HTMLElement) => {
	if (el instanceof Element) {
		cards.push(el as HTMLElement);
		observer.observe(el);
	}
};
onBeforeUnmount(() => {
	observer.disconnect();
});
</script>
<style scoped lang="scss">
.scroll-area {
	width: 28rem;
	flex-shrink: 0;
}

.emote-set-container {
	position: relative;
}

.emote-set {
	display: inline-flex;
	flex-wrap: wrap;
	margin: 0.5rem;
}

.set-header {
	height: 3rem;
	padding: 0.5rem 1.25rem;
	position: sticky;
	top: -1px;
	display: flex;
	background: var(--seventv-background-transparent-2);
}

.set-header-icon {
	height: 2rem;
	width: 2rem;
	border-radius: 0.5rem;
	margin-right: 1rem;
	overflow: clip;
}

.emote-container {
	display: grid;
	background: hsla(0deg, 0%, 50%, 6%);
	border-radius: 0.5rem;
	height: 4rem;
	margin: 0.25rem;
	cursor: pointer;

	&:hover {
		background: hsla(0deg, 0%, 50%, 32%);
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

.sidebar {
	height: 100%;
	width: 100%;
	background: hsla(0deg, 0%, 50%, 6%);
	border-left: 1px solid var(--seventv-border-transparent-1);
	overflow-y: scroll;
	scrollbar-width: none;

	&::-webkit-scrollbar {
		width: 0;
		height: 0;
	}
}

.set-sidebar-icon-container {
	width: 100%;
	padding: 0.5rem 0;

	&[selected="true"] {
		background: hsla(0deg, 0%, 50%, 32%);
	}
}

.set-sidebar-icon {
	width: 2.8rem;
	height: 2.8rem;
	border-radius: 0.5rem;
	overflow: clip;
	margin: auto;
	cursor: pointer;
}

.logo {
	width: 100%;
	height: 100%;
}
</style>
