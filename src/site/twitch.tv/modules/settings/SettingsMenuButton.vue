<template>
	<Teleport :to="containerEl">
		<div class="seventv-tw-button seventv-settings-menu-button">
			<button @click="emit('toggle')">
				<Logo7TV />
				<div v-if="!updater.isUpToDate" class="seventv-settings-menu-button-update-flair" />
			</button>
			<span :class="`tooltip-${tooltip}`"> 7TV Settings </span>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, toRaw, watch, watchEffect } from "vue";
import { HookedInstance } from "@/common/ReactHooks";
import { defineFunctionHook } from "@/common/Reflection";
import { useConfig } from "@/composable/useSettings";
import useUpdater from "@/composable/useUpdater";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";

const updater = useUpdater();

const emit = defineEmits<{
	(event: "toggle"): void;
}>();

const props = defineProps<{
	inst?: HookedInstance<Twitch.TopNavBarComponent>;
}>();

const hideBitsButton = useConfig<boolean>("layout.hide_bits_buttons");
const hideSiteNotificationsButton = useConfig<boolean>("layout.hide_site_notifications_button");
const hidePrimeCrown = useConfig<boolean>("layout.hide_prime_offers");
const hideTurboButton = useConfig<boolean>("layout.hide_turbo_button");
const hideWhispersButton = useConfig<boolean>("layout.hide_whispers_button");

const menuElements = reactive({
	renderBitsButton: hideBitsButton,
	renderOnsiteNotificatons: hideSiteNotificationsButton,
	renderTwitchPrimeCrown: hidePrimeCrown,
	renderTurboButton: hideTurboButton,
	renderWhispers: hideWhispersButton,
});

// force update top nav when user changes settings
watch(menuElements, (renderElements) => {
	rerenderTopNav(renderElements);
});

// TODO: define proper types here
function rerenderTopNav(els) {
	if (!props.inst?.component) return;
	for (const renderFunc in els) {
		defineFunctionHook(props.inst.component, renderFunc, function (old, ...args: unknown[]) {
			return els[renderFunc] ? null : old?.apply(this, args);
		});
	}
	toRaw(props.inst.component).forceUpdate();
}

const el = document.createElement("div");
el.id = "seventv-settings-button";
const containerEl = ref<HTMLElement>(el);

let tooltip = "under";
function insert7tvButton() {
	const rootNode = props.inst?.domNodes.root;
	let navmenu;
	if (rootNode) {
		// Place 7tv button next to the user profile
		navmenu = rootNode.querySelector(".top-nav__menu")?.lastChild;
	} else {
		// Legacy
		// Topnav on the main twitch page
		navmenu = document.querySelector(".top-nav__menu")?.lastChild;

		if (!navmenu) {
			// Sidenav in modview
			navmenu = document.querySelector(".modview-dock__followed-channels")?.nextSibling;
			tooltip = "right";
		}
		if (!navmenu) {
			// Header if popout
			navmenu = document.querySelector(".stream-chat-header")?.lastChild;
			tooltip = "left";
		}
	}
	if (!navmenu) return;
	if (navmenu.contains(containerEl.value)) {
		// we have to re-insert the 7tv button since re-rendering will change order
		navmenu.parentElement?.querySelector<HTMLElement>("#seventv-settings-button")?.remove();
		navmenu.insertBefore(containerEl.value, navmenu.lastChild);
	} else {
		navmenu.insertBefore(containerEl.value, navmenu.lastChild);
	}
}

// we need to render the current state from the user settings
// this should only run once after mount
watch(
	() => props.inst,
	() => {
		rerenderTopNav(menuElements);
	},
);

// this re-inserts the button when we force update the top nav component
watchEffect(() => {
	insert7tvButton();
});
</script>
<style scoped lang="scss">
@import "@/assets/style/tw-tooltip";
@import "@/assets/style/flair";

.top-nav {
	.seventv-settings-menu-button {
		margin: 0.5rem;

		> span {
			transition: opacity 0.1s ease-in 0.2s;
		}
	}
}

/* stylelint-disable-next-line selector-class-pattern */
.modview-dock__drop-zone {
	.seventv-settings-menu-button {
		margin: 0 0.5rem 1rem;

		> span {
			transition: opacity 0.1s ease-in 0.2s;
		}
	}
}

/* stylelint-disable-next-line no-descending-specificity */
.seventv-settings-menu-button {
	> button {
		> svg {
			width: 100%;
			height: 100%;
		}

		> .seventv-settings-menu-button-update-flair {
			position: absolute;
			top: 0;
			right: 0;
			width: 1rem;
			height: 1rem;

			@include flair-pulsating(#3eed58);
		}
	}
}
</style>
