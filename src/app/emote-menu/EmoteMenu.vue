<template>
	<UiFloating
		:anchor="anchorEl"
		placement="top-end"
		:middleware="[shift({ padding: 4, mainAxis: true, crossAxis: true }), offset({ mainAxis: 4, crossAxis: -4 })]"
	>
		<div v-if="ctx.open && ctx.channelID" ref="containerRef" class="seventv-emote-menu">
			<div class="seventv-emote-menu-header" :class="{ 'disabled-search-input': isSearchInputEnabled }">
				<!-- Emote Menu Header -->
				<div class="seventv-emote-menu-providers">
					<template v-for="(b, key) in visibleProviders">
						<div
							v-if="b || key === activeProvider"
							:key="key"
							class="seventv-emote-menu-provider-icon"
							:selected="key === activeProvider"
							@click="activeProvider = key"
						>
							<Logo v-if="key !== 'FAVORITE'" :provider="key" />
							<StarIcon v-else />
							<span v-show="key === activeProvider">
								<template v-if="key === 'PLATFORM'">{{ platform }}</template>
								<template v-else>{{ key }}</template>
							</span>
						</div>
					</template>
				</div>
				<div v-if="!isSearchInputEnabled" class="seventv-emote-menu-search">
					<input
						ref="searchInputRef"
						v-model="ctx.filter"
						class="seventv-emote-menu-search-input"
						autofocus
					/>
					<div class="search-icon">
						<SearchIcon />
					</div>
				</div>
			</div>

			<!-- Emote menu body -->
			<div
				v-for="(_, key) in visibleProviders"
				v-show="key === activeProvider"
				:key="key"
				class="seventv-emote-menu-body"
			>
				<EmoteMenuTab
					:provider="key"
					:selected="key === activeProvider"
					@emote-clicked="emit('emote-click', $event)"
					@provider-visible="onProviderVisibilityChange(key, $event)"
					@toggle-settings="settingsContext.toggle()"
					@toggle-native-menu="[toggle(), emit('toggle-native-menu')]"
				/>
			</div>
		</div>
	</UiFloating>
</template>

<script setup lang="ts">
import { reactive, ref, watchEffect } from "vue";
import { onClickOutside, onKeyStroke, useEventListener, useKeyModifier } from "@vueuse/core";
import { useStore } from "@/store/main";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useConfig } from "@/composable/useSettings";
import SearchIcon from "@/assets/svg/icons/SearchIcon.vue";
import StarIcon from "@/assets/svg/icons/StarIcon.vue";
import Logo from "@/assets/svg/logos/Logo.vue";
import { useEmoteMenuContext } from "./EmoteMenuContext";
import EmoteMenuTab from "./EmoteMenuTab.vue";
import { useSettingsMenu } from "@/app/settings/Settings";
import UiFloating from "@/ui/UiFloating.vue";
import { offset, shift } from "@floating-ui/dom";

export type EmoteMenuTabName = SevenTV.Provider | "FAVORITE";

const props = defineProps<{
	anchorEl: HTMLElement;
	width?: string;
	scale?: string;
}>();

const emit = defineEmits<{
	(e: "emote-click", emote: SevenTV.ActiveEmote): void;
	(e: "toggle-native-menu"): void;
	(e: "close", ev: MouseEvent): void;
}>();

const containerRef = ref<HTMLElement | undefined>();

const channelCtx = useChannelContext();
const ctx = useEmoteMenuContext();
ctx.channelID = channelCtx.id;

const settingsContext = useSettingsMenu();
const { providers, platform } = useStore();

const searchInputRef = ref<HTMLInputElement | undefined>();

const isSearchInputEnabled = useConfig<boolean>("ui.emote_menu_search");
const defaultTab = useConfig<EmoteMenuTabName>("ui.emote_menu.default_tab", "7TV");

const activeProvider = ref<EmoteMenuTabName | null>(defaultTab.value);
const visibleProviders = reactive<Record<EmoteMenuTabName, boolean>>({
	FAVORITE: true,
	"7TV": providers.has("7TV"),
	FFZ: providers.has("FFZ"),
	BTTV: providers.has("BTTV"),
	PLATFORM: true,
	EMOJI: true,
});
watchEffect(() => {
	if (!containerRef.value) return;

	containerRef.value.style.setProperty("--width", props.width ?? "unset");
	containerRef.value.style.setProperty("--seventv-emote-menu-scale", props.scale ?? "3rem");

	if (searchInputRef.value) {
		searchInputRef.value.focus();
	}
});

// Shortcut (ctrl+e)
const isCtrl = useKeyModifier("Control", { initial: false });
onKeyStroke("e", (ev) => {
	if (!isCtrl.value) return;

	toggle();
	ev.preventDefault();
});

// Up/Down Arrow iterates providers
useEventListener("keydown", (ev) => {
	if (!["ArrowUp", "ArrowDown"].includes(ev.key)) return;

	const cur = Object.keys(visibleProviders).indexOf(activeProvider.value ?? "7TV");
	const next = ev.key === "ArrowUp" ? cur + 1 : cur - 1;
	const nextProvider = Object.keys(visibleProviders)[next];

	if (nextProvider) {
		activeProvider.value = nextProvider as EmoteMenuTabName;
	}
});

// Toggle the menu's visibility
function toggle() {
	ctx.open = !ctx.open;
}

// Handle change in the visibility of a provider while using search
// and if the current active provider has no content, switch to the next available
function onProviderVisibilityChange(provider: EmoteMenuTabName, visible: boolean) {
	visibleProviders[provider] = visible;
	if (!visible && provider === activeProvider.value) {
		activeProvider.value = (Object.entries(visibleProviders)
			.slice(1)
			.find(([, v]) => v)?.[0] ?? "7TV") as SevenTV.Provider;
	}
}

onClickOutside(containerRef, (ev) => {
	emit("close", ev);
});
</script>

<style scoped lang="scss">
.seventv-emote-menu {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: auto 1fr;
	grid-template-areas:
		"header"
		"body";
	outline: 0.1em solid var(--seventv-border-transparent-1);
	background-color: var(--seventv-background-transparent-1);
	border-radius: 0.25em;
	width: var(--width);
	font-size: var(--seventv-emote-menu-scale);

	@at-root .seventv-transparent & {
		backdrop-filter: blur(1em);
	}
}

.seventv-emote-menu-header {
	grid-area: header;
	display: grid;
	grid-template-rows: 1fr 0.75fr;
	border-bottom: 0.1em solid var(--seventv-border-transparent-1);
	border-radius: 0.25em 0.25em 0 0;
	background: hsla(0deg, 0%, 50%, 6%);

	&.disabled-search-input {
		grid-template-rows: 1fr 0fr;
	}

	.seventv-emote-menu-providers {
		display: flex;
		flex-direction: row;
		justify-content: space-evenly;
		column-gap: 0.5em;
		align-items: center;
		margin: 1em 0.75em;

		.seventv-emote-menu-provider-icon {
			cursor: pointer;
			display: grid;
			place-items: center;
			grid-template-columns: 1fr;
			width: 40%;
			padding: 0.5em 0.25em;
			background: hsla(0deg, 0%, 50%, 6%);
			color: var(--seventv-text-color-secondary);
			border-radius: 0.25em;

			&:hover {
				background: #80808029;
			}

			> svg {
				width: 2em;
				height: 2em;
			}

			> span {
				font-family: Roboto, monospace;
				font-weight: 600;
				font-size: 1.5em;
			}

			transition:
				width 120ms ease-in-out,
				background 150ms ease-in-out;

			&[selected="true"] {
				background: var(--seventv-highlight-neutral-1);
				color: var(--seventv-text-color-normal);
				width: 100%;
				grid-template-columns: 3em 1fr;
			}
		}
	}

	.seventv-emote-menu-search {
		height: 100%;
		position: relative;

		.search-icon {
			position: absolute;
			display: grid;
			place-items: center;
			top: 0;
			left: 0.5em;
			height: 100%;
			user-select: none;
			pointer-events: none;
			padding: 0.85em;
			color: var(--seventv-border-transparent-1);
		}

		.seventv-emote-menu-search-input {
			background-color: var(--seventv-background-shade-1);
			width: 100%;
			height: 100%;
			border: none;
			padding-left: 3em;
			color: currentcolor;
			outline: none;
			transition: background-color 140ms;

			&:focus {
				background-color: var(--seventv-background-shade-2);
			}
		}
	}
}

.seventv-emote-menu-body {
	grid-area: body;
	display: grid;
	overflow: hidden;
	height: 40vh;

	&[selected="false"] {
		display: none;
	}
}
</style>
