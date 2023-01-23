<template>
	<Teleport :to="containerEl">
		<div v-if="open" class="seventv-emote-menu-container">
			<div class="seventv-emote-menu">
				<!-- Emote Menu Header -->
				<div class="seventv-emote-menu-header">
					<template v-for="(b, key) in visibleProviders">
						<div
							v-if="b"
							:key="key"
							class="seventv-emote-menu-provider-icon"
							:selected="key === activeProvider"
							@click="activeProvider = key"
						>
							<Logo :provider="key" />
							{{ key }}
						</div>
					</template>
				</div>

				<!-- Emote menu body -->
				<template v-for="(_, key) in visibleProviders" :key="key">
					<div v-show="key === activeProvider" class="seventv-emote-menu-body">
						<EmoteMenuTab
							:provider="key"
							:filter="filter"
							:selected="key === activeProvider"
							@emote-clicked="onEmoteClick"
							@provider-visible="onProviderVisibilityChange(key, $event)"
						/>
					</div>
				</template>
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
import { definePropertyHook, unsetPropertyHook } from "@/common/Reflection";
import Logo from "@/assets/svg/logos/Logo.vue";
import EmoteMenuTab from "./EmoteMenuTab.vue";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatInputController>;
	buttonEl?: HTMLButtonElement;
}>();

const containerEl = ref<HTMLElement | undefined>();

const open = ref(false);
const filter = ref("");

const activeProvider = ref<SevenTV.Provider | null>("7TV");
const visibleProviders = reactive<Record<SevenTV.Provider, boolean>>({
	"7TV": true,
	FFZ: true,
	BTTV: true,
	TWITCH: true,
});

// Shortcut (shift+e)
const isCtrl = useKeyModifier("Control", { initial: false });
onKeyStroke("e", (ev) => {
	if (!isCtrl.value) return;

	toggle();
	ev.preventDefault();
});

// Toggle the menu's visibility
const toggle = () => {
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

	const current = inputRef.getValue();

	inputRef.setValue(current.slice(0, filter.value.length ? filter.value.length * -1 : Infinity) + emote.name + " ");
	props.instance.component.chatInputRef.focus();
}

watchEffect(() => {
	if (!containerEl.value && props.instance.domNodes.root) {
		const n = props.instance.domNodes.root.querySelector(".chat-input__textarea");
		containerEl.value = (n?.parentElement?.parentElement ?? n) as HTMLElement;
	}
});

// This captures the current input typed by the user
definePropertyHook(props.instance.component.autocompleteInputRef, "state", {
	value(v: typeof props.instance.component.autocompleteInputRef.state) {
		if (!open.value) {
			filter.value = "";

			return;
		}

		filter.value = v.value.split(" ").at(-1) ?? "";
	},
});

onClickOutside(containerEl, () => (open.value = false));

onUnmounted(() => {
	unsetPropertyHook(props.instance.component.autocompleteInputRef, "state");
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

.seventv-emote-menu {
	width: 32rem;
	border-top-left-radius: 0.6rem;
	border-top-right-radius: 0.6rem;
	background-color: var(--seventv-background-transparent-1);
	backdrop-filter: blur(16px);
	overflow: clip;
	outline: 1px solid var(--seventv-border-transparent-1);
}

.seventv-emote-menu-container {
	position: absolute;
	inset: auto 0 100% auto;
	max-width: 100%;
}

.seventv-emote-menu-header {
	display: flex;
	height: 4.5rem;
	background: hsla(0deg, 0%, 50%, 6%);
	border-bottom: 1px solid var(--seventv-border-transparent-1);
	border-radius: 0.6rem 0.6rem 0 0;
	justify-content: space-evenly;
	padding: 0.75rem;
}

.seventv-emote-menu-provider-icon {
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

	> svg {
		width: 2rem;
		height: 2rem;
		margin-right: 0.5rem;
	}
}

.seventv-emote-menu-body {
	display: flex;
	height: 40rem;

	&[selected="false"] {
		display: none;
	}
}
</style>
