<template>
	<div class="emote-area-container">
		<UiScrollable class="scroll-area">
			<!-- Native Menu Toggle -->
			<div v-if="provider === 'TWITCH'" class="native-menu-toggle" @click="emit('toggle-native-menu')">
				<Logo provider="TWITCH" />
				<span v-t="'emote_menu.native'" />
			</div>

			<div class="emote-area">
				<div v-for="es of sortedSets" :key="es.id" v-memo="[ctx.filter, es.emotes, selected]">
					<EmoteMenuSet
						:ref="'es-' + es.id"
						:es="es"
						@emote-clicked="(ae) => emit('emote-clicked', ae)"
						@emotes-updated="(emotes) => updateVisibility(es, !!emotes.length)"
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
					<div v-if="!updater.isUpToDate" class="seventv-emote-menu-settings-button-update-flair" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useStore } from "@/store/main";
import { debounceFn } from "@/common/Async";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useCosmetics } from "@/composable/useCosmetics";
import { useConfig } from "@/composable/useSettings";
import useUpdater from "@/composable/useUpdater";
import GearsIcon from "@/assets/svg/icons/GearsIcon.vue";
import Logo from "@/assets/svg/logos/Logo.vue";
import type { EmoteMenuTabName } from "./EmoteMenu.vue";
import { useEmoteMenuContext } from "./EmoteMenuContext";
import EmoteMenuSet from "./EmoteMenuSet.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const props = defineProps<{
	provider: EmoteMenuTabName;
	selected?: boolean;
}>();

const emit = defineEmits<{
	(event: "emote-clicked", emote: SevenTV.ActiveEmote): void;
	(event: "provider-visible", state: boolean): void;
	(event: "toggle-settings"): void;
	(event: "toggle-native-menu"): void;
}>();

const { t } = useI18n();
const ctx = useEmoteMenuContext();
const channelContext = useChannelContext(ctx.channelID);
const emotes = useChatEmotes(channelContext);
const updater = useUpdater();
const selectedSet = ref("");

// The source emote sets from this emote provider
const sets = emotes.byProvider(props.provider as SevenTV.Provider) ?? reactive({});
const store = useStore();
const cosmetics = useCosmetics(store.identity?.id ?? "");
const visibleSets = reactive<Set<SevenTV.EmoteSet>>(new Set());
const sortedSets = ref([] as SevenTV.EmoteSet[]);
const favorites = useConfig<Set<string>>("ui.emote_menu.favorites");
const usage = useConfig<Map<string, number>>("ui.emote_menu.usage");
const shouldShowUsage = useConfig<boolean>("ui.emote_menu.most_used");

function updateFavorites() {
	return Array.from(favorites.value.values())
		.map((eid) => emotes.find((ae) => ae.id === eid))
		.filter((ae) => !!ae) as SevenTV.ActiveEmote[];
}

function updateUsage() {
	return Array.from(usage.value.entries())
		.sort((a, b) => b[1] - a[1])
		.map((e) => emotes.find((ae) => ae.id === e[0]))
		.filter((ae) => !!ae)
		.slice(0, 50) as SevenTV.ActiveEmote[];
}

if (props.provider === "FAVORITE") {
	// create favorite set
	const favSet = (sets["FAVORITE"] = reactive({
		id: "FAVORITE",
		name: t("emote_menu.favorite_set"),
		emotes: updateFavorites(),
	} as SevenTV.EmoteSet));

	sets["USAGE"] = reactive({
		id: "USAGE",
		name: t("emote_menu.most_used_set"),
		emotes: updateUsage(),
	} as SevenTV.EmoteSet);

	watch(favorites, () => {
		favSet.emotes = updateFavorites();
	});

	watch([usage, shouldShowUsage], ([, shouldShow]) => {
		sets["USAGE"].emotes = shouldShow ? updateUsage() : [];
	});
}

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

	if (channelContext.id && es.owner && es.owner.id === channelContext.id) return -1;
	if ((es.flags ?? 0) & 4) return -2;
	return 0;
}

function sortFn(a: SevenTV.EmoteSet, b: SevenTV.EmoteSet) {
	const c1 = sortCase(a);
	const c2 = sortCase(b);

	return c1 == c2 ? a.name.localeCompare(b.name) : c1 > c2 ? 1 : -1;
}

function updateVisibility(es: SevenTV.EmoteSet, state: boolean): void {
	if (state) {
		visibleSets.add(es);
	} else {
		visibleSets.delete(es);
	}

	emit("provider-visible", !!visibleSets.size);
}

const filterSets = debounceFn(() => {
	const ary = Object.values(sets) as SevenTV.EmoteSet[];
	if (cosmetics.emoteSets?.size) {
		ary.push(...Array.from(cosmetics.emoteSets.values()).filter((e) => e.provider === props.provider));
	}

	if (props.provider === "TWITCH") {
		const res = ary.reduce((accu, cur) => {
			const p = accu[cur.name];
			if (p) {
				p.emotes.push(...cur.emotes);
			} else {
				accu[cur.name] = { set: cur, emotes: [...cur.emotes] };
			}
			return accu;
		}, {} as Record<string, { set: SevenTV.EmoteSet; emotes: SevenTV.ActiveEmote[] }>);

		ary.splice(0, ary.length, ...Object.values(res).map((e) => ({ ...e.set, emotes: e.emotes })));
	}

	// Sort emote sets
	ary.sort(sortFn);
	sortedSets.value = ary;
}, 50);

// Watch for changes to the emote sets and perform sorting operations
watch(() => [ctx.filter, sets, cosmetics.emoteSets], filterSets, {
	immediate: true,
});
</script>
<style scoped lang="scss">
@import "@/assets/style/flair.scss";

.emote-area-container {
	flex-shrink: 1;
	display: flex;
}
.scroll-area {
	width: 28rem;
	flex-shrink: 0;
}

.native-menu-toggle {
	display: inline-block;
	text-align: center;
	grid-template-columns: 3rem 1fr;
	width: 100%;
	padding: 0.25rem 1rem;
	cursor: pointer;

	transition: background 0.2s ease-in-out;

	svg,
	span {
		display: inline-block;
		vertical-align: middle;
		font-size: 1.25rem;
		margin: 0.5rem;
	}

	&:hover {
		background: hsla(0deg, 0%, 50%, 6%);
	}
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
			border-radius: 0.25rem;
			justify-content: center;
			cursor: pointer;

			&:hover {
				background: hsla(0deg, 0%, 50%, 32%);
			}

			> svg {
				height: 2rem;
				width: 2rem;
			}

			> .seventv-emote-menu-settings-button-update-flair {
				position: absolute;
				height: 1rem;
				width: 1rem;
				transform: translateY(-0.25rem);
				right: 0.65rem;

				@include flair-pulsating(#3eed58);
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
