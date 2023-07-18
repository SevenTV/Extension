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

defineExpose({
	render7TVButton,
});

const hideBitsButton = useConfig<boolean>("layout.hide_topnav_bits_button");
const hideSiteNotificationsButton = useConfig<boolean>("layout.hide_site_notifications_button");
const hidePrimeCrown = useConfig<boolean>("layout.hide_prime_offers");
const hideTurboButton = useConfig<boolean>("layout.hide_turbo_button");
const hideWhispersButton = useConfig<boolean>("layout.hide_whispers_button");

const menuElements = reactive({
	renderBitsButton: hideBitsButton,
	renderOnsiteNotifications: hideSiteNotificationsButton,
	renderTwitchPrimeCrown: hidePrimeCrown,
	renderTurboButton: hideTurboButton,
	renderWhispers: hideWhispersButton,
});

// force update top nav when user changes settings
watch(menuElements, () => rerenderTopNav());

function rerenderTopNav() {
	if (!props.inst?.component) return;
	toRaw(props.inst.component).forceUpdate();
}

const el = document.createElement("div");
el.id = "seventv-settings-button";
const containerEl = ref<HTMLElement>(el);

let tooltip = "under";
function render7TVButton() {
	const rootNode = props.inst?.domNodes.root;
	if (!rootNode) return;
	// Place 7tv button next to the user profile
	const navmenu = rootNode.querySelector(".top-nav__menu")?.lastChild;
	if (!navmenu) return;
	navmenu.insertBefore(containerEl.value, navmenu.lastChild);
}

function renderLegacy7TVButton() {
	// Legacy Code for Mod View and Pop-out Chat
	let menuButtons = document.querySelector(".top-nav__menu")?.lastChild;
	// Sidenav in modview (for some reason this is no longer stylized properly)
	if (!menuButtons) {
		menuButtons = document.querySelector(".modview-dock__followed-channels")?.firstChild;
		tooltip = "right";
	}
	if (!menuButtons) {
		// Header if popout
		menuButtons = document.querySelector(".stream-chat-header")?.lastChild;
		tooltip = "left";
	}
	if (menuButtons) {
		menuButtons.insertBefore(containerEl.value, menuButtons.lastChild);
	}
}

// we need to render the current state from the user settings
watch(
	() => props.inst?.domNodes,
	() => {
		Object.keys(menuElements).forEach((renderFunc) => {
			if (!props.inst?.component) return;
			// TODO: define proper types here
			defineFunctionHook(props.inst.component, renderFunc, function (old, ...args: unknown[]) {
				return menuElements[renderFunc] ? null : old?.apply(this, args);
			});
		});
		rerenderTopNav();
	},
);

watchEffect(() => {
	renderLegacy7TVButton();
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
