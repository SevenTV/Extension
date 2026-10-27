<template>
	<div class="seventv-emote-menu-tab-container">
		<UiScrollable>
			<!-- Native Menu Toggle -->
			<div v-if="provider === 'PLATFORM'" class="seventv-native-menu-toggle" @click="emit('toggle-native-menu')">
				<Logo provider="PLATFORM" />
				<span v-t="'emote_menu.native'" />
			</div>

			<!-- Personal Set Promotion -->
			<template v-if="provider === '7TV' && !actor.sub">
				<EmoteMenuSet :es="promotionPersonalSet" :ephemeral="true">
					<div class="seventv-promotion-personal-emotes">
						<div>
							<p v-t="'emote_menu.personal_emotes_promo_1'" />
							<span>
								{{
									t("emote_menu.personal_emotes_promo_2", {
										PLATFORM: store.platform.charAt(0) + store.platform.slice(1).toLowerCase(),
									})
								}}
							</span>
						</div>

						<StoreSubscribeButton />
					</div>
				</EmoteMenuSet>
			</template>

			<template v-if="provider === 'FAVORITE' && !hasFavoriteEmotes()">
				<div class="seventv-promotion-personal-emotes">
					<div>
						<p v-t="'emote_menu.favorite_emotes_hint_1'" />
						<i18n-t keypath="emote_menu.favorite_emotes_hint_2" tag="span">
							<template #HOTKEY>
								<strong>ALT</strong>
							</template>
						</i18n-t>
					</div>
				</div>
			</template>

			<template v-for="es of sortedSets" :key="es.id">
				<EmoteMenuSet
					v-if="es.emotes.length"
					:ref="'es-' + es.id"
					:es="es"
					@emote-clicked="(ae) => emit('emote-clicked', ae)"
					@emotes-updated="(emotes) => updateVisibility(es, !!emotes.length)"
				/>
			</template>
		</UiScrollable>
		<div class="seventv-emote-menu-tab-sidebar">
			<div class="seventv-emote-menu-sidebar-icons">
				<template v-for="es in sortedSets" :key="es.id">
					<div
						v-if="es.emotes.length"
						class="seventv-emote-menu-set-sidebar-icon-container"
						:selected="selectedSet == es.id"
						@click="select(es.id, $refs['es-' + es.id] as InstanceType<typeof EmoteMenuSet>[])"
					>
						<div class="seventv-emote-menu-set-sidebar-icon">
							<div
								v-if="es.provider === 'EMOJI' && emojiCategories.indexOf(es.name) > -1"
								class="seventv-emote-menu-emoji-group"
							>
								<SingleEmoji :id="emojiGroupIcons[emojiCategories.indexOf(es.name)]" :alt="es.name" />
							</div>
							<img v-else-if="es.owner && es.owner.avatar_url" :src="es.owner.avatar_url" />
							<svg
								v-else-if="es.name === 'Global'"
								class="kick-native-set-icon"
								viewBox="0 0 20 20"
								fill="currentColor"
								width="100%"
								height="100%"
								aria-label="Global"
							>
								<path
									d="M10 1.67q-.45 0-.86.04c-.65.67-1.26 2.02-1.64 3.9a14 14 0 0 0 5 0c-.38-1.88-1-3.23-1.64-3.9zm0 5q-1.4-.01-2.65-.23-.21 1.4-.26 3.07a52 52 0 0 0 5.82 0q-.04-1.66-.26-3.07-1.25.23-2.65.23m3.46 7.06q1.86.45 3.16 1.3A8.3 8.3 0 0 0 18.34 10l-.02-.48c-1.13.42-2.88.66-4.57.77-.02 1.16-.1 2.34-.28 3.44m-.57-3.39a57 57 0 0 1-5.8 0q.01 1.76.25 3.22a15 15 0 0 1 5.3 0q.23-1.46.26-3.22M6.7 5.43a11 11 0 0 1 1.2-3.49A8.3 8.3 0 0 0 3.94 4.3c.75.48 1.7.87 2.76 1.13m3.3 8.74q-1.3 0-2.5.22c.38 1.88 1 3.23 1.64 3.9a10 10 0 0 0 1.72 0c.65-.66 1.26-2.02 1.64-3.9q-1.2-.22-2.5-.22m8.22-5.47a8 8 0 0 0-1.6-3.73 10 10 0 0 1-3.16 1.3q.25 1.55.27 3.18c2.21-.17 3.74-.47 4.49-.77zM12.1 1.94c.53.9.93 2.12 1.2 3.5a10 10 0 0 0 2.77-1.14 8.3 8.3 0 0 0-3.98-2.36M6.54 13.73q-.26-1.68-.28-3.45-1.46-.1-2.63-.29-1.2-.2-1.94-.46l-.02.47c0 1.9.64 3.64 1.7 5.04a10 10 0 0 1 3.17-1.3zm-.28-4.28c.02-1.07.11-2.16.27-3.17q-1.86-.46-3.16-1.31a8 8 0 0 0-1.6 3.72c.75.3 2.27.6 4.49.77zm7.04 5.12a11 11 0 0 1-1.2 3.49 8.3 8.3 0 0 0 3.97-2.36 10 10 0 0 0-2.75-1.13zm-5.4 3.49c-.53-.9-.93-2.12-1.2-3.5q-1.62.41-2.76 1.14a8.3 8.3 0 0 0 3.98 2.36z"
								/>
							</svg>
							<svg
								v-else-if="es.name === 'Collectibles'"
								class="kick-native-set-icon"
								viewBox="0 0 20 20"
								fill="currentColor"
								width="100%"
								height="100%"
								aria-label="Collectibles"
							>
								<path
									d="M1.67 5.83v8.34c0 .91.75 1.66 1.66 1.66V4.17c-.91 0-1.66.75-1.66 1.66m15-1.66v11.66c.91 0 1.66-.75 1.66-1.66V5.83c0-.91-.75-1.66-1.66-1.66m-2.5-2.5H5.83c-.91 0-1.66.75-1.66 1.66v13.34c0 .91.75 1.66 1.66 1.66h8.34c.91 0 1.66-.75 1.66-1.66V3.33c0-.91-.75-1.66-1.66-1.66m-.84 9.66-3.33 2-3.33-2v-3h.83V7.5l2.5-.83 2.5.83v.83h.83z"
								/>
							</svg>
							<img
								v-else-if="es.name === 'Emojis' || es.name === 'Emotes'"
								class="kick-native-set-icon"
								src="https://files.kick.com/emotes/1730831/fullsize"
								alt="Emotes"
							/>
							<Logo v-else class="logo" :provider="es.provider" />
						</div>
					</div>
				</template>
			</div>
			<div class="seventv-emote-menu-settings-button-container">
				<div class="seventv-emote-menu-settings-button" @click="emit('toggle-settings')">
					<GearsIcon :provider="'7TV'" />
					<div v-if="!updater.isUpToDate" class="seventv-emote-menu-settings-button-update-flair" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useStore } from "@/store/main";
import { debounceFn } from "@/common/Async";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useActor } from "@/composable/useActor";
import { useCosmetics } from "@/composable/useCosmetics";
import { useConfig } from "@/composable/useSettings";
import useUpdater from "@/composable/useUpdater";
import SingleEmoji from "@/assets/svg/emoji/SingleEmoji.vue";
import GearsIcon from "@/assets/svg/icons/GearsIcon.vue";
import Logo from "@/assets/svg/logos/Logo.vue";
import type { EmoteMenuTabName } from "./EmoteMenu.vue";
import { useEmoteMenuContext } from "./EmoteMenuContext";
import EmoteMenuSet from "./EmoteMenuSet.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import StoreSubscribeButton from "../store/StoreSubscribeButton.vue";

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
const actor = useActor();
const visibleSets = reactive<Set<string>>(new Set());
const sortedSets = ref([] as SevenTV.EmoteSet[]);
const favorites = useConfig<Set<string>>("ui.emote_menu.favorites");
// const usage = useConfig<Map<string, number>>("ui.emote_menu.usage");
// const shouldShowUsage = useConfig<boolean>("ui.emote_menu.most_used");

// Emote icons for groups
const emojiGroupIcons = ["1f603", "1f44b", "1f343", "1f354", "26bd", "1f698", "1f4a1", "1f523", "1f6a9"];
const emojiCategories = [
	"Smileys & Emotion",
	"People & Body",
	"Animals & Nature",
	"Food & Drink",
	"Activities",
	"Travel & Places",
	"Objects",
	"Symbols",
	"Flags",
];

const promotionPersonalSet: SevenTV.EmoteSet = {
	id: "personal-ad",
	name: "Personal Emotes",
	emotes: [],
};

function updateFavorites() {
	if (!favorites.value) return [];

	return Array.from(favorites.value.values())
		.map((eid) => emotes.find((ae) => ae.id === eid))
		.filter((ae) => !!ae) as SevenTV.ActiveEmote[];
}

if (props.provider === "FAVORITE") {
	// create favorite set
	const favSet = (sets["FAVORITE"] = reactive({
		id: "FAVORITE",
		name: t("emote_menu.favorite_set"),
		emotes: updateFavorites(),
	} as SevenTV.EmoteSet));

	watch(favorites, () => {
		favSet.emotes = updateFavorites();
	});
}

function hasFavoriteEmotes() {
	return props.provider === "FAVORITE" && sets["FAVORITE"].emotes.length > 0;
}

// Select an Emote Set to jump-scroll to
async function select(setID: string, coms: InstanceType<typeof EmoteMenuSet>[] | null | undefined) {
	if (!coms || !coms.length) return;
	const com = coms[0];
	if (!com.containerEl) return;

	selectedSet.value = setID;
	com.expand();
	await nextTick();
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

	if (
		a.provider === "EMOJI" &&
		b.provider === "EMOJI" &&
		emojiCategories.indexOf(a.name) > -1 &&
		emojiCategories.indexOf(b.name) > -1
	)
		return emojiCategories.indexOf(a.name) - emojiCategories.indexOf(b.name);

	return c1 == c2 ? a.name.localeCompare(b.name) : c1 > c2 ? 1 : -1;
}

function updateVisibility(es: SevenTV.EmoteSet, state: boolean): void {
	if (state) {
		visibleSets.add(es.id);
	} else {
		visibleSets.delete(es.id);
	}

	emit("provider-visible", !!visibleSets.size);
}

const filterSets = debounceFn(() => {
	const ary = Object.values(sets) as SevenTV.EmoteSet[];
	if (cosmetics.emoteSets?.size) {
		ary.push(...Array.from(cosmetics.emoteSets.values()).filter((e) => e.provider === props.provider));
	}

	if (props.provider === "PLATFORM") {
		const res = ary.reduce(
			(accu, cur) => {
				const p = accu[cur.name];
				if (p) {
					p.emotes.push(...cur.emotes);
				} else {
					accu[cur.name] = { set: cur, emotes: [...cur.emotes] };
				}
				return accu;
			},
			{} as Record<string, { set: SevenTV.EmoteSet; emotes: SevenTV.ActiveEmote[] }>,
		);

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
@import "@/assets/style/flair";

.seventv-emote-menu-tab-container {
	display: grid;
	grid-template-columns: 1fr auto;
	grid-template-rows: 1fr;
	overflow: hidden;
}

.seventv-native-menu-toggle {
	display: inline-block;
	text-align: center;
	grid-template-columns: 3em 1fr;
	width: 100%;
	padding: 0.25em 1em;
	cursor: pointer;
	transition: background 0.2s ease-in-out;

	svg,
	span {
		display: inline-block;
		vertical-align: middle;
		font-size: 1.25em;
		margin: 0.5em;
	}

	&:hover {
		background: hsla(0deg, 0%, 50%, 6%);
	}
}

.seventv-emote-menu-tab-sidebar {
	overflow: hidden;
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
	background: hsla(0deg, 0%, 50%, 6%);
	border-left: 1px solid var(--seventv-border-transparent-1);

	.seventv-emote-menu-sidebar-icons {
		overflow-y: scroll;
		scrollbar-width: none;

		&::-webkit-scrollbar {
			width: 0;
			height: 0;
		}
	}

	.seventv-emote-menu-settings-button-container {
		justify-content: center;
		width: 100%;
		margin-top: auto;
		float: bottom;
		height: 4em;
		flex-shrink: 0;
		padding: auto;
		border-top: 1px solid var(--seventv-border-transparent-1);

		.seventv-emote-menu-settings-button {
			display: flex;
			margin: 0.5em;
			padding: 0.5em;
			border-radius: 0.25em;
			justify-content: center;
			cursor: pointer;

			&:hover {
				background: hsla(0deg, 0%, 50%, 32%);
			}

			> svg {
				height: 2em;
				width: 2em;
			}

			> .seventv-emote-menu-settings-button-update-flair {
				position: absolute;
				height: 1em;
				width: 1em;
				transform: translateY(-0.25em);
				right: 0.65em;

				@include flair-pulsating(#3eed58);
			}
		}
	}
}

.seventv-emote-menu-set-sidebar-icon-container {
	width: 100%;
	padding: 0.5em 0;

	&[selected="true"] {
		background: hsla(0deg, 0%, 50%, 32%);
	}
}

.seventv-emote-menu-set-sidebar-icon {
	width: 2.8em;
	height: 2.8em;
	border-radius: 0.5em;
	overflow: clip;
	margin: auto;
	cursor: pointer;

	> img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
}

.logo {
	width: 100%;
	height: 100%;
}

.seventv-emote-menu-emoji-group {
	width: 100%;
	height: 100%;
}

.seventv-promotion-personal-emotes {
	display: grid;
	row-gap: 0.25rem;
	justify-items: center;
	text-align: center;
	margin: 0.5em 1em;

	p {
		font-size: 1.088em;
		font-weight: bold;
	}

	span {
		font-size: 0.9em;
	}

	button {
		font-size: 1.5em;
	}
}
</style>
