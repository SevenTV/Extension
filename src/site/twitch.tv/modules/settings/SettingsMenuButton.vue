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
import { ref, toRaw, watch, watchEffect } from "vue";
import { HookedInstance } from "@/common/ReactHooks";
import { defineFunctionHook } from "@/common/Reflection";
import { useConfig } from "@/composable/useSettings";
import useUpdater from "@/composable/useUpdater";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";

const emit = defineEmits<{
	(event: "toggle"): void;
}>();

const props = defineProps<{
	inst: HookedInstance<Twitch.TopNavBarComponent> | undefined;
}>();

const hideBitsButton = useConfig<boolean>("layout.hide_bits_buttons");
const hideSiteNotificationsButton = useConfig<boolean>("layout.hide_site_notifications_button");
const hidePrimeCrown = useConfig<boolean>("layout.hide_prime_offers");
const hideTurboButton = useConfig<boolean>("layout.hide_turbo_button");
const hideWhispersButton = useConfig<boolean>("layout.hide_whispers_button");

watch(
	hideBitsButton,
	(v) => {
		if (!props.inst?.component) return;
		createFunctionHook(props.inst.component, "renderBitsButton", v);
		rerenderTopNav();
	},
	{ immediate: true },
);

watch(
	hideSiteNotificationsButton,
	(v) => {
		if (!props.inst?.component) return;
		createFunctionHook(props.inst.component, "renderOnsiteNotifications", v);
		rerenderTopNav();
	},
	{ immediate: true },
);

watch(
	hideTurboButton,
	(v) => {
		if (!props.inst?.component) return;
		createFunctionHook(props.inst.component, "renderTurboButton", v);
		rerenderTopNav();
	},
	{ immediate: true },
);

watch(
	hidePrimeCrown,
	(v) => {
		if (!props.inst?.component) return;
		createFunctionHook(props.inst.component, "renderTwitchPrimeCrown", v);
		rerenderTopNav();
	},
	{ immediate: true },
);

watch(
	hideWhispersButton,
	(v) => {
		if (!props.inst?.component) return;
		createFunctionHook(props.inst.component, "renderWhispers", v);
		rerenderTopNav();
	},
	{ immediate: true },
);

function createFunctionHook<C extends object>(prop: C, funcName: keyof C, state: boolean) {
	defineFunctionHook(prop, funcName, function (old, ...args: unknown[]) {
		return state ? null : old?.apply(this, args);
	});
}

function rerenderTopNav() {
	if (!props.inst?.component) return;
	toRaw(props.inst.component).forceUpdate();
}

const el = document.createElement("div");
el.id = "seventv-settings-button";
const containerEl = ref<HTMLElement>(el);

function insert7tvButton() {
	const rootNode = props.inst?.domNodes.root;
	if (!rootNode) return;

	// Place 7tv button next to the user profile
	const navmenu = rootNode.querySelector<HTMLElement>(".top-nav__menu")?.lastChild;
	if (!navmenu) return;
	if (navmenu?.contains(containerEl.value)) {
		navmenu.parentElement?.querySelector<HTMLElement>("#seventv-settings-button")?.remove();
		navmenu.insertBefore(containerEl.value, navmenu.lastChild);
	} else {
		navmenu.insertBefore(containerEl.value, navmenu.lastChild);
	}
}

watchEffect(() => {
	insert7tvButton();
});

const updater = useUpdater();

// Topnav on the main twitch page
let menuButtons = document.querySelector(".top-nav__menu")?.lastChild;
let tooltip = "under";

if (!menuButtons) {
	// Sidenav in modview
	menuButtons = document.querySelector(".modview-dock__followed-channels")?.nextSibling;
	tooltip = "right";
}
if (!menuButtons) {
	// Header if popout
	menuButtons = document.querySelector(".stream-chat-header")?.lastChild;
	tooltip = "left";
}
// if (menuButtons) {
// 	menuButtons.insertBefore(containerEl.value, menuButtons.lastChild);
// }
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
