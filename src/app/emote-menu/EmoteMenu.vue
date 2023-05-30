<template>
	<UiFloating
		:anchor="anchorEl"
		placement="top-end"
		:middleware="[shift({ padding: 4, mainAxis: true, crossAxis: true }), offset({ mainAxis: 4, crossAxis: -4 })]"
	>
		<div v-if="ctx.open && ctx.channelID" ref="containerRef" class="seventv-emote-menu">
			<div class="seventv-emote-menu-header">
				<!-- Emote Menu Header -->
				<div class="seventv-emote-menu-providers">
					<template v-for="(b, key) in visibleProviders">
						<div
							v-if="b"
							:key="key"
							class="seventv-emote-menu-provider-icon"
							:selected="key === activeProvider"
							@click="activeProvider = key"
						>
							<Logo v-if="key !== 'FAVORITE'" :provider="key" />
							<StarIcon v-else />
							<span v-show="key === activeProvider && key !== 'FAVORITE'">{{ key }}</span>
						</div>
					</template>
				</div>
				<div v-if="!isSearchInputEnabled" class="seventv-emote-menu-search">
					<input ref="searchInputRef" v-model="ctx.filter" class="seventv-emote-menu-search-input" />
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
import { onMounted, reactive, ref, watchEffect } from "vue";
import { onClickOutside, onKeyStroke, useKeyModifier } from "@vueuse/core";
import { useStore } from "@/store/main";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { getModuleRef } from "@/composable/useModule";
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
const { providers } = useStore();

const searchInputRef = ref<HTMLInputElement | undefined>();

const isSearchInputEnabled = useConfig<boolean>("ui.emote_menu_search");

const activeProvider = ref<EmoteMenuTabName | null>("7TV");
const visibleProviders = reactive<Record<EmoteMenuTabName, boolean>>({
	FAVORITE: true,
	"7TV": providers.has("7TV"),
	FFZ: providers.has("FFZ"),
	BTTV: providers.has("BTTV"),
	PLATFORM: true,
	EMOJI: true,
});

const inputModule = getModuleRef<"TWITCH", "chat-input-controller">("chat-input-controller");

onMounted(() => {
	if (!inputModule.value?.instance) return;

	/*
	inputModule.value.instance.addButton(
		"emote-menu",
		EmoteMenuButton,
		{
			onClick: () => (ctx.open = !ctx.open),
		},
		1,
	);*/
});

watchEffect(() => {
	if (!containerRef.value) return;

	containerRef.value.style.setProperty("--width", props.width ?? "unset");
	containerRef.value.style.setProperty("--seventv-emote-menu-scale", props.scale ?? "3rem");
});

// Shortcut (ctrl+e)
const isCtrl = useKeyModifier("Control", { initial: false });
onKeyStroke("e", (ev) => {
	if (!isCtrl.value) return;

	toggle();
	ev.preventDefault();
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
		activeProvider.value = (Object.entries(visibleProviders).find(([, v]) => v)?.[0] ?? "7TV") as SevenTV.Provider;
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
	border-bottom: 0.1em solid var(--seventv-border-transparent-1);
	border-radius: 0.6em 0.6em 0 0;
	background: hsla(0deg, 0%, 50%, 6%);
}

.seventv-emote-menu-providers {
	display: flex;
	flex-direction: row;
	justify-content: space-evenly;
	column-gap: 0.5em;
	align-items: center;
	margin: 1em;

	.seventv-emote-menu-provider-icon {
		cursor: pointer;
		display: grid;
		place-items: center;
		grid-template-columns: 1fr;
		width: 60%;
		padding: 0.5em 0;
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
		}

		transition: width 90ms ease-in-out, background 150ms ease-in-out;

		&[selected="true"] {
			background: var(--seventv-highlight-neutral-1);
			color: var(--seventv-text-color-normal);
			width: 100%;
			grid-template-columns: 3em 1fr;
		}
	}
}

.seventv-emote-menu-search {
	padding: 0 0.75em 0.75em;
	width: 100%;
	position: relative;

	.search-icon {
		position: absolute;
		display: flex;
		align-items: center;
		top: 0;
		left: 1em;
		height: 3em;
		width: 3em;
		user-select: none;
		pointer-events: none;
		padding: 0.85em;
		color: var(--seventv-border-transparent-1);
	}

	.seventv-emote-menu-search-input {
		background-color: var(--seventv-background-shade-1);
		border-radius: 0.4em;
		height: 3em;
		width: 100%;
		border: 1px solid var(--seventv-border-transparent-1);
		padding-left: 3em;
		color: currentcolor;
		outline: none;
		transition: outline 140ms;

		&:focus {
			outline: 1px solid var(--seventv-primary);
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

.seventv-emote-menu0 {
	position: relative;
	max-height: calc(100vh - 15em);
	display: flex;
	flex-direction: column;
	width: 21em;
	overflow: clip;
	border-radius: 0.25em;
	background-color: var(--seventv-background-transparent-1);
	z-index: 10;

	@at-root .seventv-transparent & {
		backdrop-filter: blur(1em);
	}

	outline: 0.1em solid var(--seventv-border-transparent-1);

	.seventv-emote-menu-header {
		border-bottom: 0.1em solid var(--seventv-border-transparent-1);
		border-radius: 0.6em 0.6em 0 0;
		background: hsla(0deg, 0%, 50%, 6%);

		.seventv-emote-menu-header-providers {
			display: flex;
			height: 4.5em;
			justify-content: space-evenly;
			column-gap: 0.5em;
			padding: 0.75em;

			.seventv-emote-menu-provider-icon {
				padding: 0.5em;
				cursor: pointer;
				display: flex;
				user-select: none;
				justify-content: center;
				column-gap: 0.5em;
				background: hsla(0deg, 0%, 50%, 6%);
				color: var(--seventv-text-color-secondary);
				border-radius: 0.2em;
				flex-grow: 1;
				width: 2em;

				&:hover {
					background: #80808029;
				}

				transition: width 90ms ease-in-out, background 150ms ease-in-out;

				&[selected="true"] {
					background: var(--seventv-highlight-neutral-1);
					color: var(--seventv-text-color-normal);
					width: 6em;
				}

				> svg {
					width: 2em;
					height: 2em;
				}

				> span {
					font-family: Roboto, monospace;
					font-weight: 600;
				}
			}
		}

		.seventv-emote-menu-search {
			padding: 0 0.75em 0.75em;
			width: 100%;
			position: relative;

			.search-icon {
				position: absolute;
				display: flex;
				align-items: center;
				top: 0;
				left: 1em;
				height: 3em;
				width: 3em;
				user-select: none;
				pointer-events: none;
				padding: 0.85em;
				color: var(--seventv-border-transparent-1);

				> svg {
					height: 100%;
					width: 100%;
				}
			}

			.seventv-emote-menu-search-input {
				background-color: var(--seventv-background-shade-1);
				border-radius: 0.4em;
				height: 3em;
				width: 100%;
				border: 1px solid var(--seventv-border-transparent-1);
				padding-left: 3em;
				color: currentcolor;
				outline: none;
				transition: outline 140ms;

				&:focus {
					outline: 1px solid var(--seventv-primary);
				}
			}
		}
	}

	.seventv-emote-menu-body {
		display: flex;
		height: 40em;
		overflow: hidden;
		flex-shrink: 1;

		&[selected="false"] {
			display: none;
		}
	}
}
</style>
