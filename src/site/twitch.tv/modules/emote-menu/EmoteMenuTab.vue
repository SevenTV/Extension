<template>
	<div class="emote-area-container">
		<UiScrollable class="scroll-area">
			<div class="emote-area">
				<div v-for="es of sortedSets" :key="es.id">
					<EmoteMenuSet
						:ref="'es-' + es.id"
						:es="es"
						:emotes="filteredEmotes[es.id]"
						@emote-clicked="(ae) => emit('emote-clicked', ae)"
					/>
				</div>
			</div>
		</UiScrollable>
		<div class="sidebar">
			<div class="sidebar-icons">
				<template v-for="es in sortedSets" :key="es.id">
					<div
						v-if="es.emotes.length"
						class="set-sidebar-icon-container"
						:selected="selectedSet == es.id"
						@click="select(es.id, $refs['es-' + es.id] as InstanceType<typeof EmoteMenuSet>[])"
					>
						<div class="set-sidebar-icon">
							<img v-if="es.owner && es.owner.avatar_url" :src="es.owner.avatar_url" />
							<Logo v-else class="logo" :provider="es.provider" />
						</div>
					</div>
				</template>
			</div>
			<div class="settings-button-container">
				<div class="settings-button" @click="emit('toggle-settings')">
					<GearsIcon :provider="'7TV'" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, toRaw, toRef } from "vue";
import { watchDebounced } from "@vueuse/core";
import { useStore } from "@/store/main";
import { determineRatio } from "@/common/Image";
import { useChatContext } from "@/composable/chat/useChatContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useCosmetics } from "@/composable/useCosmetics";
import GearsIcon from "@/assets/svg/icons/GearsIcon.vue";
import Logo from "@/assets/svg/logos/Logo.vue";
import EmoteMenuSet from "./EmoteMenuSet.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const props = defineProps<{
	provider: SevenTV.Provider;
	filter?: string;
	selected?: boolean;
}>();

const emit = defineEmits<{
	(event: "emote-clicked", emote: SevenTV.ActiveEmote): void;
	(event: "provider-visible", state: boolean): void;
	(event: "toggle-settings"): void;
}>();

const context = useChatContext();
const emotes = useChatEmotes();
const selectedSet = ref("");

// The source emote sets from this emote provider
const sets = emotes.byProvider(props.provider);
const store = useStore();
const cosmetics = useCosmetics(store.identity?.id ?? "");
const personalEmotes = toRef(cosmetics, "emotes");
const sortedSets = ref([] as SevenTV.EmoteSet[]);
const filteredEmotes = ref<Record<string, SevenTV.ActiveEmote[]>>({});

// Select an Emote Set to jump-scroll to
function select(setID: string, coms: InstanceType<typeof EmoteMenuSet>[] | null | undefined) {
	if (!coms || !coms.length) return;
	const com = coms[0];
	if (!com.containerEl) return;

	selectedSet.value = setID;
	com.containerEl.scrollIntoView({ behavior: "auto" });
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
		const res = [] as SevenTV.ActiveEmote[];
		for (const e of set.emotes) {
			if (filter && !e.name.toLowerCase().includes(filter.toLowerCase())) {
				continue;
			}

			res.push(e);
		}

		x[set.id] = res;
		total += res.length;
	}

	filteredEmotes.value = x;
	emit("provider-visible", !!total);
}

function filterSets(): void {
	const ary = Object.values(structuredClone(toRaw(sets.value))) as SevenTV.EmoteSet[];
	if (cosmetics.emoteSets?.length) {
		ary.push(...structuredClone(toRaw(cosmetics.emoteSets).filter((e) => e.provider === props.provider)));
	}

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
}

// Watch for changes to the emote sets and perform sorting operations
watchDebounced([sets, emotes.active, personalEmotes], filterSets, { debounce: 150, immediate: true });

// Listen for user search query
watchDebounced(props, ({ filter }) => filterEmotes(filter ?? ""), { debounce: 250 });
</script>
<style scoped lang="scss">
.emote-area-container {
	flex-shrink: 1;
	display: flex;
}
.scroll-area {
	width: 28rem;
	flex-shrink: 0;
}

.sidebar {
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
	background: hsla(0deg, 0%, 50%, 6%);
	border-left: 1px solid var(--seventv-border-transparent-1);

	.sidebar-icons {
		overflow-y: scroll;
		scrollbar-width: none;

		&::-webkit-scrollbar {
			width: 0;
			height: 0;
		}
	}

	.settings-button-container {
		justify-content: center;
		width: 100%;
		margin-top: auto;
		float: bottom;
		height: 4rem;
		flex-shrink: 0;
		padding: auto;
		border-top: 1px solid var(--seventv-border-transparent-1);

		.settings-button {
			display: flex;
			margin: 0.5rem;
			padding: 0.5rem;
			border-radius: 0.5rem;
			justify-content: center;
			cursor: pointer;

			&:hover {
				background: hsla(0deg, 0%, 50%, 32%);
			}

			> svg {
				height: 2rem;
				width: 2rem;
			}
		}
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
