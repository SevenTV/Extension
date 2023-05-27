<template>
	<UiFloating :anchor="anchorEl" placement="top-end" :middleware="[shift({ mainAxis: true, crossAxis: true })]">
		<div v-if="ctx.open && ctx.channelID" ref="containerRef" class="seventv-emote-menu-container">
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
								<Logo v-if="key !== 'FAVORITE'" :provider="key" />
								<StarIcon v-else />
								<span v-show="key === activeProvider && key !== 'FAVORITE'">{{ key }}</span>
							</div>
						</template>
					</div>
					<div v-if="!isSearchInputEnabled" class="emote-search">
						<input ref="searchInputRef" v-model="ctx.filter" class="emote-search-input" />
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
						@emote-clicked="onEmoteClick"
						@provider-visible="onProviderVisibilityChange(key, $event)"
						@toggle-settings="settingsContext.toggle()"
						@toggle-native-menu="toggle(true)"
					/>
				</div>
			</div>
		</div>
	</UiFloating>

	<!-- Replace the emote menu button -->
	<Teleport v-if="buttonEl && placement === 'regular'" :to="buttonEl">
		<EmoteMenuButton @click="toggle()" />
		<div class="seventv-emote-menu-button" :class="{ 'menu-open': ctx.open }" @click.stop="toggle()">
			<Logo provider="7TV" />
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref, watch, watchEffect } from "vue";
import { onClickOutside, onKeyStroke, useKeyModifier } from "@vueuse/core";
import { log } from "@/common/Logger";
import { HookedInstance } from "@/common/ReactHooks";
import { defineFunctionHook, definePropertyHook, unsetPropertyHook } from "@/common/Reflection";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { getModuleRef } from "@/composable/useModule";
import { useConfig } from "@/composable/useSettings";
import SearchIcon from "@/assets/svg/icons/SearchIcon.vue";
import StarIcon from "@/assets/svg/icons/StarIcon.vue";
import Logo from "@/assets/svg/logos/Logo.vue";
import EmoteMenuButton from "./EmoteMenuButton.vue";
import { useEmoteMenuContext } from "./EmoteMenuContext";
import EmoteMenuTab from "./EmoteMenuTab.vue";
import { useSettingsMenu } from "@/app/settings/Settings";
import UiFloating from "@/ui/UiFloating.vue";
import { shift } from "@floating-ui/dom";

export type EmoteMenuTabName = SevenTV.Provider | "FAVORITE";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatInputController>;
	buttonEl?: HTMLButtonElement;
}>();

const anchorEl = ref<HTMLElement | undefined>();
const inputEl = ref<HTMLElement | undefined>();
const containerRef = ref<HTMLElement | undefined>();

const ctx = useEmoteMenuContext();
ctx.channelID = props.instance.component.props.channelID ?? "";

const channelCtx = useChannelContext(ctx.channelID, true);
const settingsContext = useSettingsMenu();
const emotes = useChatEmotes(channelCtx);

const searchInputRef = ref<HTMLInputElement | undefined>();

const isSearchInputEnabled = useConfig<boolean>("ui.emote_menu_search");
const usage = useConfig<Map<string, number>>("ui.emote_menu.usage");

const activeProvider = ref<EmoteMenuTabName | null>("7TV");
const visibleProviders = reactive<Record<EmoteMenuTabName, boolean>>({
	FAVORITE: true,
	"7TV": true,
	FFZ: true,
	BTTV: true,
	TWITCH: true,
	EMOJI: true,
});

const chatModule = getModuleRef("chat");
const placement = useConfig<"regular" | "below" | "hidden">("ui.emote_menu.button_placement");
const inputModule = getModuleRef<"TWITCH", "chat-input-controller">("chat-input-controller");

onMounted(() => {
	if (!inputModule.value?.instance) return;

	inputModule.value.instance.addButton(
		"emote-menu",
		EmoteMenuButton,
		{
			onClick: () => (ctx.open = !ctx.open),
		},
		1,
	);
});

// Shortcut (ctrl+e)
const isCtrl = useKeyModifier("Control", { initial: false });
onKeyStroke("e", (ev) => {
	if (!isCtrl.value) return;

	toggle();
	ev.preventDefault();
});

// Toggle the menu's visibility
function toggle(native?: boolean) {
	const t = props.instance.component;
	if (native) {
		t.onEmotePickerButtonClick();
		ctx.open = false;
		return;
	}

	if (ctx.open) {
		t.props.closeEmotePicker();
	} else {
		t.props.clearMenus();
		t.closeBitsCard();
		t.closePaidPinnedChatCardForEmotePicker();
		t.closeCheerCard();
	}

	ctx.open = !ctx.open;
	nextTick(() => {
		if (!searchInputRef.value) return;

		searchInputRef.value.focus();
	});
}

function handleEmoteUsage(s: string): string {
	const sp = s.split(" ");
	for (const name of sp) {
		const emote = emotes.active[name];
		if (!emote) continue;

		usage.value.set(emote.id, (usage.value.get(emote.id) ?? 0) + 1);
	}

	usage.value = new Map(usage.value);

	return s;
}

watch(
	chatModule,
	(mod) => {
		if (!mod || !mod.instance) return;

		mod.instance.messageSendMiddleware.set("emote-menu-usage", handleEmoteUsage);
	},
	{ immediate: true },
);

// Handle change in the visibility of a provider while using search
// and if the current active provider has no content, switch to the next available
function onProviderVisibilityChange(provider: EmoteMenuTabName, visible: boolean) {
	visibleProviders[provider] = visible;
	if (!visible && provider === activeProvider.value) {
		activeProvider.value = (Object.entries(visibleProviders).find(([, v]) => v)?.[0] ?? "7TV") as SevenTV.Provider;
	}
}

function onEmoteClick(emote: SevenTV.ActiveEmote) {
	const inputRef = props.instance.component.autocompleteInputRef;
	if (!inputRef) return log.warn("ref to input not found, cannot insert emote");

	let current = inputRef.getValue();

	if (isSearchInputEnabled.value) {
		current = current.slice(0, ctx.filter.length ? ctx.filter.length * -1 : Infinity);
	} else {
		current = current.at(-1) === " " ? current : current + " ";
	}

	inputRef.setValue(current + (emote.unicode ?? emote.name) + " ");
	props.instance.component.chatInputRef.focus();
}

defineFunctionHook(props.instance.component, "onBitsIconClick", function (old) {
	old?.();
	ctx.open = false;
});

// This captures the current input typed by the user
definePropertyHook(props.instance.component.autocompleteInputRef, "state", {
	value(v: typeof props.instance.component.autocompleteInputRef.state) {
		if (!ctx.open) {
			ctx.filter = "";

			return;
		}

		if (!isSearchInputEnabled.value) return;

		ctx.filter = v.value.split(" ").at(-1) ?? "";
	},
});

// Handle click-outside
// This closes the menu
onClickOutside(containerRef, (e) => {
	if (settingsContext.open || !(e.target instanceof Node)) return;

	// If the click was inside the input or on the button, ignore it
	if (inputEl.value && inputEl.value.contains(e.target)) {
		return;
	} else if (props.buttonEl && props.buttonEl.contains(e.target)) {
		return;
	}

	ctx.open = false;
});

// Capture anchor / input elements
watchEffect(() => {
	if (!anchorEl.value && props.instance.domNodes.root) {
		const n = props.instance.domNodes.root.querySelector(".seventv-chat-input-textarea");
		if (!n) return;

		const anchor = n.querySelector("[data-test-selector='chat-input']") ?? n;

		anchorEl.value = (anchor ?? n) as HTMLElement;
		inputEl.value = n as HTMLElement;
	}
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
	max-width: 100%;
	z-index: 10;

	.seventv-emote-menu {
		position: relative;
		max-height: calc(100vh - 15rem);
		display: flex;
		flex-direction: column;
		width: 32rem;
		overflow: clip;
		border-radius: 0.25rem;
		background-color: var(--seventv-background-transparent-1);

		@at-root .seventv-transparent & {
			backdrop-filter: blur(1rem);
		}

		outline: 0.1rem solid var(--seventv-border-transparent-1);

		.seventv-emote-menu-header {
			border-bottom: 0.1rem solid var(--seventv-border-transparent-1);
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

					> span {
						font-family: Roboto, monospace;
						font-weight: 600;
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
