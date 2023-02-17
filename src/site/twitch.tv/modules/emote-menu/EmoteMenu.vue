<template>
	<Teleport :to="containerEl">
		<div v-if="open && ctx.channelID" class="seventv-emote-menu-container">
			<div class="seventv-emote-menu">
				<!-- Emote Menu Header -->
				<div class="seventv-emote-menu-header">
					<div class="seventv-emote-menu-header-providers">
						<template v-for="(b, key) in visibleProviders">
							<div
								v-if="b"
								:key="key"
								class="seventv-emote-menu-provider-icon"
								:selected="key === activeProvider"
								@click="activeProvider = key"
							>
								<Logo :provider="key" />
								<span v-show="key === activeProvider">{{ key }}</span>
							</div>
						</template>
					</div>
					<div v-if="!inputSearch" class="emote-search">
						<input v-model="ctx.filter" class="emote-search-input" />
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
					v-memo="[activeProvider === key, visibleProviders, ctx.filter]"
					class="seventv-emote-menu-body"
				>
					<EmoteMenuTab
						:provider="key"
						:selected="key === activeProvider"
						@emote-clicked="onEmoteClick"
						@provider-visible="onProviderVisibilityChange(key, $event)"
						@toggle-settings="settingsContext.toggle()"
					/>
				</div>
			</div>
		</div>
	</Teleport>

	<!-- Replace the emote menu button -->
	<Teleport v-if="buttonEl" :to="buttonEl">
		<div class="seventv-emote-menu-button" :class="{ 'menu-open': open }" @click.stop="toggle">
			<Logo provider="7TV" />
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { onUnmounted, reactive, ref, watchEffect } from "vue";
import { onClickOutside, onKeyStroke, useKeyModifier } from "@vueuse/core";
import { log } from "@/common/Logger";
import { HookedInstance } from "@/common/ReactHooks";
import { defineFunctionHook, definePropertyHook, unsetPropertyHook } from "@/common/Reflection";
import { useConfig } from "@/composable/useSettings";
import { useSettingsMenu } from "@/site/global/settings/Settings";
import SearchIcon from "@/assets/svg/icons/SearchIcon.vue";
import Logo from "@/assets/svg/logos/Logo.vue";
import { useEmoteMenuContext } from "./EmoteMenuContext";
import EmoteMenuTab from "./EmoteMenuTab.vue";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatInputController>;
	buttonEl?: HTMLButtonElement;
}>();

const containerEl = ref<HTMLElement | undefined>();

const ctx = useEmoteMenuContext();
ctx.channelID = props.instance.component.chatInputRef.props.channelID ?? "";

const settingsContext = useSettingsMenu();

const open = ref(false);

const inputSearch = useConfig<boolean>("ui.emote_menu_search");

const activeProvider = ref<SevenTV.Provider | null>("7TV");
const visibleProviders = reactive<Record<SevenTV.Provider, boolean>>({
	"7TV": true,
	FFZ: true,
	BTTV: true,
	TWITCH: true,
	EMOJI: true,
});

// Shortcut (ctrl+e)
const isCtrl = useKeyModifier("Control", { initial: false });
onKeyStroke("e", (ev) => {
	if (!isCtrl.value) return;

	toggle();
	ev.preventDefault();
});

// Toggle the menu's visibility
const toggle = () => {
	//Close other stuff if we open the emote menu
	const t = props.instance.component;
	if (open.value) {
		t.props.closeEmotePicker();
	} else {
		t.props.clearMenus();
		t.closeBitsCard();
		t.closePaidPinnedChatCardForEmotePicker();
		t.closeCheerCard();
	}
	open.value = !open.value;
};

// Handle change in the visibility of a provider while using search
// and if the current active provider has no content, switch to the next available
function onProviderVisibilityChange(provider: SevenTV.Provider, visible: boolean) {
	visibleProviders[provider] = visible;
	if (!visible && provider === activeProvider.value) {
		activeProvider.value = (Object.entries(visibleProviders).find(([, v]) => v)?.[0] ?? "7TV") as SevenTV.Provider;
	}
}

function onEmoteClick(emote: SevenTV.ActiveEmote) {
	const inputRef = props.instance.component.autocompleteInputRef;
	if (!inputRef) return log.warn("ref to input not found, cannot insert emote");

	let current = inputRef.getValue();

	if (inputSearch.value) {
		current = current.slice(0, ctx.filter.length ? ctx.filter.length * -1 : Infinity);
	} else {
		current = current.at(-1) === " " ? current : current + " ";
	}

	inputRef.setValue(current + (emote.unicode ?? emote.name) + " ");
	props.instance.component.chatInputRef.focus();
}

watchEffect(() => {
	if (!containerEl.value && props.instance.domNodes.root) {
		const n = props.instance.domNodes.root.querySelector(".chat-input__textarea");
		containerEl.value = (n?.parentElement?.parentElement ?? n) as HTMLElement;
	}
});

defineFunctionHook(props.instance.component, "onBitsIconClick", function (old) {
	old?.();
	open.value = false;
});

// This captures the current input typed by the user
definePropertyHook(props.instance.component.autocompleteInputRef, "state", {
	value(v: typeof props.instance.component.autocompleteInputRef.state) {
		if (!open.value) {
			ctx.filter = "";

			return;
		}

		if (!inputSearch.value) return;

		ctx.filter = v.value.split(" ").at(-1) ?? "";
	},
});

onClickOutside(containerEl, () => {
	if (settingsContext.open) return;

	open.value = false;
});

onUnmounted(() => {
	unsetPropertyHook(props.instance.component.autocompleteInputRef, "state");
	unsetPropertyHook(props.instance.component, "onBitsIconClick");
});
</script>

<style scoped lang="scss">
.seventv-emote-menu-button {
	display: grid;
	place-items: center;
	width: 100%;
	height: 100%;
	font-size: 2rem;

	transition: color 150ms ease-in-out;
	&.menu-open {
		color: var(--seventv-primary);
	}
}

.seventv-emote-menu-container {
	position: absolute;
	inset: auto 0 100% auto;
	max-width: 100%;
	.seventv-emote-menu {
		max-height: calc(100vh - 15rem);
		display: flex;
		flex-direction: column;
		width: 32rem;
		overflow: clip;
		border-top-left-radius: 0.6rem;
		border-top-right-radius: 0.6rem;
		background-color: var(--seventv-background-transparent-1);
		@at-root .seventv-transparent & {
			backdrop-filter: blur(16px);
		}
		outline: 1px solid var(--seventv-border-transparent-1);

		.seventv-emote-menu-header {
			border-bottom: 1px solid var(--seventv-border-transparent-1);
			border-radius: 0.6rem 0.6rem 0 0;
			background: hsla(0deg, 0%, 50%, 6%);

			.seventv-emote-menu-header-providers {
				display: flex;
				height: 4.5rem;
				justify-content: space-evenly;
				column-gap: 0.5rem;
				padding: 0.75rem;

				.seventv-emote-menu-provider-icon {
					padding: 0.5rem;
					cursor: pointer;
					display: flex;
					user-select: none;
					justify-content: center;
					column-gap: 0.5em;
					background: hsla(0deg, 0%, 50%, 6%);
					color: var(--seventv-text-color-secondary);
					border-radius: 0.2rem;
					flex-grow: 1;
					width: 2rem;

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
						width: 2rem;
						height: 2rem;
					}
				}
			}

			.emote-search {
				padding: 0 0.75rem 0.75rem;
				width: 100%;
				position: relative;

				.search-icon {
					position: absolute;
					display: flex;
					align-items: center;
					top: 0;
					left: 1rem;
					height: 3rem;
					width: 3rem;
					user-select: none;
					pointer-events: none;
					padding: 0.85rem;
					color: var(--seventv-border-transparent-1);

					> svg {
						height: 100%;
						width: 100%;
					}
				}

				.emote-search-input {
					background-color: var(--seventv-background-shade-1);
					border-radius: 0.4rem;
					height: 3rem;
					width: 100%;
					border: 1px solid var(--seventv-border-transparent-1);
					padding-left: 3rem;
					color: currentColor;
				}
			}
		}

		.seventv-emote-menu-body {
			display: flex;
			height: 40rem;
			overflow: hidden;
			flex-shrink: 1;

			&[selected="false"] {
				display: none;
			}
		}
	}
}
</style>
