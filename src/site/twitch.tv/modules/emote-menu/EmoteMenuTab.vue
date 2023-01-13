<template>
	<UiScrollable class="scroll-area">
		<div class="emote-area">
			<template v-for="(emoteSet, i) of concatenated" :key="i">
				<div v-if="emoteSet.emotes.length" :ref="'set-' + i.toString()" class="emote-set-container">
					<div class="set-header">
						<div class="set-header-icon">
							<img v-if="emoteSet.owner && emoteSet.owner.avatar_url" :src="emoteSet.owner.avatar_url" />
							<Logo v-else class="logo" :provider="emoteSet.provider" />
						</div>
						{{ emoteSet.name }}
					</div>
					<div class="emote-set">
						<div
							v-for="emote of emoteSet.emotes"
							:key="emote.id"
							:ref="(el) => setCardRef(el as HTMLElement)"
							class="emote-container"
							:class="`ratio-${determineRatio(emote)}`"
							:visible="loaded[emote.id]"
							:emote-id="emote.id"
							@click="emit('emoteClick', emote)"
						>
							<Emote :emote="emote" :unload="!loaded[emote.id]" />
						</div>
					</div>
				</div>
			</template>
		</div>
	</UiScrollable>
	<div class="sidebar">
		<template v-for="(emoteSet, i) of concatenated" :key="i">
			<div
				v-if="emoteSet.emotes.length"
				class="set-sidebar-icon-container"
				:selected="selectedSet == i"
				@click="
					{
						selectedSet = i;
						($refs['set-' + i.toString()] as HTMLDivElement[])[0].scrollIntoView({ behavior: 'smooth' });
					}
				"
			>
				<div class="set-sidebar-icon">
					<img v-if="emoteSet.owner && emoteSet.owner.avatar_url" :src="emoteSet.owner.avatar_url" />
					<Logo v-else class="logo" :provider="emoteSet.provider" />
				</div>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { until, useTimeout } from "@vueuse/core";
import { determineRatio } from "@/site/twitch.tv/modules/emote-menu/EmoteMenuBackend";
import Logo from "@/assets/svg/logos/Logo.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import Emote from "../chat/components/message/Emote.vue";

const props = defineProps<{
	emoteSets: SevenTV.EmoteSet[];
}>();

const emit = defineEmits<{
	(event: "emoteClick", emote: SevenTV.ActiveEmote): void;
}>();

const selectedSet = ref(0);

const refs = [] as HTMLElement[];
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

const concatenated = computed(() => {
	const temp = new Map<string, SevenTV.EmoteSet>();
	for (const s of props.emoteSets) {
		const e = temp.get(s.name);
		e ? temp.set(s.name, { ...s, emotes: [...e.emotes, ...s.emotes] }) : temp.set(s.name, s);
	}
	return Array.from(temp.values());
});
// gather all card elements and observe them
const setCardRef = (el: HTMLElement) => {
	if (el instanceof Element) {
		refs.push(el as HTMLElement);
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
