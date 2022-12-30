<template>
	<Teleport :to="containerEl">
		<div class="emote-menu-container" :visible="isVisible">
			<div class="emote-menu">
				<!-- Emote Menu Header -->
				<div class="header">
					<div
						v-for="provider of providers.keys()"
						:key="provider"
						class="provider"
						:selected="provider == selectedProvider"
						@click="selectedProvider = provider"
					>
						<Logo class="logo" :provider="provider" />
						{{ provider }}
					</div>
				</div>
				<!-- Emote menu body -->
				<template v-for="[provider, emoteSets] of providers" :key="provider">
					<div class="body" :selected="provider == selectedProvider">
						<EmoteTab :emote-sets="emoteSets" :input-controller="instance.component" :filter="filter" />
					</div>
				</template>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
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
import EmoteTab from "./EmoteTab.vue";
import { onClickOutside } from "@vueuse/core";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatInputController>;
}>();

const containerEl = ref();
containerEl.value = document.querySelector(".chat-input__textarea") ?? undefined;

const isVisible = ref(false);
const selectedProvider = ref("TWITCH" as SevenTV.Provider);

const providers = ref(new Map<SevenTV.Provider, SevenTV.EmoteSet[]>());

const filter = ref("");

// Determine order
providers.value.set("TWITCH", []);
providers.value.set("7TV", []);
providers.value.set("FFZ", []);
providers.value.set("BTTV", []);

function sortEmotes(a: SevenTV.ActiveEmote, b: SevenTV.ActiveEmote) {
	const ra = determineRatio(a);
	const rb = determineRatio(b);
	return ra == rb ? a.name.localeCompare(b.name) : ra > rb ? 1 : -1;
}

function sortSets(a: SevenTV.EmoteSet, b: SevenTV.EmoteSet) {
	// Place global at the bottom
	if (a.provider?.endsWith("/G") || a.name == "Other emotes") return 1;
	if (b.provider?.endsWith("/G") || b.name == "Other emotes") return -1;

	// Sort by id ?
	return a.name.localeCompare(b.name);
}

watch(useChatAPI().emoteProviders.value, (emoteProvider) => {
	for (const [p, sets] of Object.entries(emoteProvider)) {
		const temp = new Map<string, SevenTV.EmoteSet>();
		for (const [, set] of Object.entries(sets))
			temp.has(set.name) ? temp.get(set.name)?.emotes.concat(set.emotes) : temp.set(set.name, set);
		temp.forEach((s) => s.emotes.sort(sortEmotes));
		providers.value.set(p as SevenTV.Provider, Array.from(temp.values()).sort(sortSets));
	}
});

let unsub: (() => void) | undefined;

function toggleEmoteMenu() {
	if (unsub) unsub();
	if (!isVisible.value) unsub = onClickOutside(containerEl, toggleEmoteMenu);

	isVisible.value = !isVisible.value;
}

function onKeyDown(ev: KeyboardEvent) {
	if (ev.key == "Control") {
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

let t: number;

definePropertyHook(props.instance.component.autocompleteInputRef, "state", {
	value(v: typeof props.instance.component.autocompleteInputRef.state) {
		clearTimeout(t);
		t = setTimeout(() => {
			filter.value = v.value.split(" ").at(-1) ?? "";
		}, 20);
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
	background-color: #18181b;
	box-shadow: var(--shadow-elevation-2) !important;
}

.header {
	display: flex;
	background: rgba(217, 217, 217, 3%);
	box-shadow: 0 1px 2px rgb(0 0 0 / 15%);
	border-radius: 0.6rem 0.6rem 0 0;
	justify-content: space-between;
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
	color: white;
	margin-right: 0.5rem;
}

.body {
	display: flex;
	height: 40rem;

	&[selected="false"] {
		display: none;
	}
}
</style>
