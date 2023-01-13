<template>
	<Teleport :to="containerEl">
		<div v-if="loaded" v-show="isVisible" class="emote-menu-container">
			<div class="emote-menu">
				<!-- Emote Menu Header -->
				<div class="header">
					<div
						v-for="provider of filtered.keys()"
						:key="provider"
						class="provider"
						:selected="provider == selectedProvider"
						@click="select = provider"
					>
						<Logo class="logo" :provider="provider" />
						{{ provider }}
					</div>
				</div>
				<!-- Emote menu body -->
				<template v-for="[provider, emoteSets] of filtered" :key="provider">
					<div v-show="provider == selectedProvider" class="body">
						<EmoteMenuTab :emote-sets="emoteSets" @emote-click="onEmoteClick" />
					</div>
				</template>
				<div v-if="filtered.size == 0" class="body empty">
					<div class="title">No emotes found</div>
					<div class="subtitle">(The input box is the search bar)</div>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useStore } from "@/store/main";
import { debounceFn } from "@/common/Async";
import { determineRatio } from "@/common/Image";
import { HookedInstance } from "@/common/ReactHooks";
import {
	defineFunctionHook,
	defineNamedEventHandler,
	definePropertyHook,
	unsetNamedEventHandler,
	unsetPropertyHook,
} from "@/common/Reflection";
import { useCosmetics } from "@/composable/useCosmetics";
import { useChatAPI } from "@/site/twitch.tv/ChatAPI";
import EmoteMenuTab from "@/site/twitch.tv/modules/emote-menu/EmoteMenuTab.vue";
import Logo from "@/assets/svg/logos/Logo.vue";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatInputController>;
}>();

const { identity } = useStore();
const { emoteProviders, currentChannel } = useChatAPI();
const { emoteSets: personalEmoteSets, emotes: personalEmotes } = useCosmetics(identity?.id ?? "");

const containerEl = ref();
containerEl.value = document.querySelector(".chat-input__textarea") ?? undefined;

const isVisible = ref(false);
const loaded = ref(false);
const select = ref("TWITCH" as SevenTV.Provider);

const providers = ref<Map<SevenTV.Provider, SevenTV.EmoteSet[]>>(new Map());
const selectedProvider = computed(() => {
	return filtered.value.has(select.value)
		? select.value
		: filtered.value.size
		? filtered.value.keys().next().value
		: null;
});

const filtered = computed(() => {
	return filter.value == ""
		? providers.value
		: new Map(
				Array.from(providers.value)
					.map(([p, sets]) => {
						return [
							p,
							sets
								.map((s) => {
									return {
										...s,
										emotes: s.emotes.filter((e) => {
											return e.name.toLowerCase().includes(filter.value.toLowerCase());
										}),
									} as SevenTV.EmoteSet;
								})
								.filter((s) => {
									return s.emotes.length;
								}),
						];
					})
					.filter(([, s]) => {
						return (s as SevenTV.EmoteSet[]).length;
					}) as [SevenTV.Provider, SevenTV.EmoteSet[]][],
		  );
});

function onEmoteClick(emote: SevenTV.ActiveEmote) {
	const inputRef = props.instance.component.autocompleteInputRef;
	const current = inputRef.getValue();

	inputRef.setValue(current.slice(0, filter.value.length ? filter.value.length * -1 : Infinity) + emote.name + " ");
	props.instance.component.chatInputRef.focus();
}

function sortEmotes(a: SevenTV.ActiveEmote, b: SevenTV.ActiveEmote) {
	const ra = determineRatio(a);
	const rb = determineRatio(b);
	return ra == rb ? a.name.localeCompare(b.name) : ra > rb ? 1 : -1;
}

function specialCases(s: SevenTV.EmoteSet) {
	// Clauses that should place at bottom
	if (s.provider?.endsWith("/G") || s.name == "Other emotes") return 1;

	// Clauses that should place at top
	if (s.name == currentChannel.value.display_name) return -1;
	if (s.flags & 4) return -2;
	return 0;
}

function sortSets(a: SevenTV.EmoteSet, b: SevenTV.EmoteSet) {
	const sa = specialCases(a);
	const sb = specialCases(b);

	// Sort by special case then name
	return sa == sb ? a.name.localeCompare(b.name) : sa > sb ? 1 : -1;
}

const remap = debounceFn(() => {
	const temp = new Map<SevenTV.Provider, SevenTV.EmoteSet[]>();
	temp.set("TWITCH", []);
	temp.set("7TV", []);
	temp.set("FFZ", []);
	temp.set("BTTV", []);

	for (const [p, sets] of Object.entries(emoteProviders.value)) {
		const test = Object.values(sets).sort(sortSets);
		test.forEach((s) => s.emotes.sort(sortEmotes));
		temp.set(p as SevenTV.Provider, test);
	}

	if (personalEmoteSets.value?.length) {
		temp.set("7TV", [...temp.get("7TV")!, ...personalEmoteSets.value].sort(sortSets));
	}

	providers.value = temp;
}, 1000);

watch(emoteProviders, () => remap(), { immediate: true, deep: true });
watch(personalEmotes, () => remap(), { immediate: true });

let unsub: (() => void) | undefined;

function toggleEmoteMenu() {
	loaded.value = true;
	if (unsub) unsub();
	if (!isVisible.value) {
		unsub = onClickOutside(containerEl, toggleEmoteMenu);
		props.instance.component.chatInputRef.focus();
	}

	isVisible.value = !isVisible.value;
}

// disable menu toggle using ctrl
const emoteMenuKey = "NONE";

function onKeyDown(ev: KeyboardEvent) {
	if (ev.key == emoteMenuKey) {
		toggleEmoteMenu();
	}
}

watch(
	() => props.instance.domNodes.root,
	(node, old) => {
		if (node === old) return;

		if (old instanceof HTMLElement) {
			unsetNamedEventHandler(old, "OpenEmoteMenu", "keydown");
		}

		if (node instanceof HTMLElement) {
			defineNamedEventHandler(node, "OpenEmoteMenu", "keydown", onKeyDown);
		}
	},
	{ immediate: true },
);

const inputBox = ref("");

const filter = computed(() => {
	return inputBox.value.split(" ").at(-1) ?? "";
});

definePropertyHook(props.instance.component.autocompleteInputRef, "state", {
	value(v: typeof props.instance.component.autocompleteInputRef.state) {
		if (!isVisible.value) return;
		inputBox.value = v.value;
	},
});

onMounted(() => {
	const component = props.instance.component;

	defineFunctionHook(component, "onEmotePickerToggle", toggleEmoteMenu);
});

onUnmounted(() => {
	const component = props.instance.component;

	unsetPropertyHook(component, "onEmotePickerToggle");
	unsetPropertyHook(component.autocompleteInputRef, "state");

	if (unsub) unsub();
	loaded.value = false;
});
</script>

<style scoped lang="scss">
.emote-menu-container {
	position: absolute;
	inset: auto 0 100% auto;
	max-width: 100%;

	&[visible="false"] {
		display: none;
	}
}

.emote-menu {
	width: 32rem;
	border-top-left-radius: 0.6rem;
	border-top-right-radius: 0.6rem;
	background-color: var(--seventv-background-transparent-1);
	backdrop-filter: blur(16px);
	overflow: clip;
	outline: 1px solid var(--seventv-border-transparent-1);
}

.header {
	display: flex;
	height: 4.5rem;
	background: hsla(0deg, 0%, 50%, 6%);
	border-bottom: 1px solid var(--seventv-border-transparent-1);
	border-radius: 0.6rem 0.6rem 0 0;
	justify-content: space-evenly;
	padding: 0.75rem;
}

.provider {
	padding: 0.5rem;
	cursor: pointer;
	display: flex;
	user-select: none;
	justify-content: center;
	background: hsla(0deg, 0%, 50%, 6%);
	color: var(--seventv-text-color-secondary);
	border-radius: 0.2rem;

	&:hover {
		background: #80808029;
	}

	&[selected="true"] {
		background: var(--seventv-highlight-neutral-1);
		color: var(--seventv-text-color-normal);
	}
}

.logo {
	width: 2rem;
	height: 2rem;
	margin-right: 0.5rem;
}

.body {
	display: flex;
	height: 40rem;

	&[selected="false"] {
		display: none;
	}
}

.empty {
	display: block;
	padding: 4rem;
	text-align: center;
	.title {
		font-size: 2rem;
		margin-bottom: 1rem;
	}
	.subtitle {
		font-size: 1.5rem;
	}
}
</style>
