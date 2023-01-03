<template>
	<Teleport :to="containerEl">
		<div v-show="isVisible" class="emote-menu-container">
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
						<EmoteMenuTab :emote-sets="emoteSets" :image-format="imageFormat" @emote-click="onEmoteClick" />
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
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { HookedInstance } from "@/common/ReactHooks";
import {
	defineFunctionHook,
	definePropertyHook,
	defineNamedEventHandler,
	unsetNamedEventHandler,
	unsetPropertyHook,
} from "@/common/Reflection";
import { useChatAPI } from "../../ChatAPI";
import { determineRatio } from "./EmoteMenuBackend";
import Logo from "@/common/Logo.vue";
import EmoteMenuTab from "./EmoteMenuTab.vue";
import { onClickOutside } from "@vueuse/core";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatInputController>;
}>();

const { emoteProviders, currentChannel, imageFormat } = useChatAPI();

const containerEl = ref();
containerEl.value = document.querySelector(".chat-input__textarea") ?? undefined;

const isVisible = ref(false);
const select = ref("TWITCH" as SevenTV.Provider);

const providers = ref(new Map<SevenTV.Provider, SevenTV.EmoteSet[]>());
// Determine order
providers.value.set("TWITCH", []);
providers.value.set("7TV", []);
providers.value.set("FFZ", []);
providers.value.set("BTTV", []);

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
	return 0;
}

function sortSets(a: SevenTV.EmoteSet, b: SevenTV.EmoteSet) {
	const sa = specialCases(a);
	const sb = specialCases(b);

	// Sort by special case then name
	return sa == sb ? a.name.localeCompare(b.name) : sa > sb ? 1 : -1;
}

watch(
	emoteProviders,
	(e) => {
		for (const [p, sets] of Object.entries(e)) {
			const temp = new Map<string, SevenTV.EmoteSet>();
			for (const [, set] of Object.entries(sets))
				temp.has(set.name) ? temp.get(set.name)?.emotes.concat(set.emotes ?? []) : temp.set(set.name, set);
			temp.forEach((s) => s.emotes.sort(sortEmotes));
			providers.value.set(p as SevenTV.Provider, Array.from(temp.values()).sort(sortSets));
		}
	},
	{ immediate: true, deep: true },
);

let unsub: (() => void) | undefined;

function toggleEmoteMenu() {
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
	border-radius: 0.6rem !important;
	background-color: var(--color-background-float);
	box-shadow: var(--color-hinted-grey-3);
}

.header {
	display: flex;
	height: 4.5rem;
	background: rgba(217, 217, 217, 3%);
	box-shadow: 0 1px 2px rgb(0 0 0 / 15%);
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

	&[selected="true"] {
		background: hsla(0deg, 0%, 100%, 16%);
		border-radius: 0.2rem;
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
