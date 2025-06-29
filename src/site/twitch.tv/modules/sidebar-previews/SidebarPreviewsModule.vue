<template>
	<template v-for="inst in sidebarCard.instances" :key="inst.identifier">
		<SidebarCard v-if="showPreviews" :instance="inst" />
	</template>
</template>

<script setup lang="ts">
import { declareModule } from "@/composable/useModule";
import { declareConfig, useConfig } from "@/composable/useSettings";
import { useComponentHook } from "@/common/ReactHooks";
import SidebarCard from "./SidebarCard.vue";
import { ref, watch } from "vue";
import { useElementHover } from "@vueuse/core";

const { markAsReady } = declareModule("sidebar-previews", {
	name: "Sidebar Previews",
	depends_on: ["settings"],
});

const showPreviews = useConfig<boolean>("ui.sidebar_previews");

const sidebarCard = useComponentHook<Twitch.SidebarCardComponent>({
	parentSelector: ".side-nav-section",
	predicate: (n) => n.props && n.props.title && n.props.isWatchParty !== null && n.props.linkTo,
});

const sidebar = useComponentHook<Twitch.SideBarComponent>(
	{
		childSelector: ".side-nav",
		predicate: (n) => n.collapseOnBreakpoint,
	},
	{
		trackRoot: true,
	},
);

const sidebarToggle = useComponentHook<Twitch.SideBarToggleComponent>({
	parentSelector: ".side-nav",
	predicate: (n) => n.handleToggleVisibility,
});

const expandOnHover = useConfig<boolean>("ui.sidebar_hover_expand");
function toggle(hovering: boolean) {
	if (!expandOnHover.value) return;

	const btn = sidebarToggle.instances.at(0)?.component;
	if (!btn) return;

	if (hovering !== btn.props.collapsed) return;

	btn.handleToggleVisibility();
}

const hoverDelay = useConfig<number>("ui.sidebar_hover_expand_delay");
const sidebarEl = ref<Element>();
const isHovering = useElementHover(sidebarEl, { delayEnter: hoverDelay.value });
watch(isHovering, toggle, { immediate: true });

watch(
	() => sidebar.instances.at(0)?.domNodes["root"],
	(n) => (sidebarEl.value = n),
	{ immediate: true },
);

markAsReady();
</script>

<script lang="ts">
const expandOnHover = useConfig<boolean>("ui.sidebar_hover_expand");
export const config = [
	declareConfig("ui.sidebar_previews", "TOGGLE", {
		path: ["Appearance", "Interface"],
		label: "Sidebar Stream Thumbnails",
		hint: "Show stream thumbnails when hovering over streams on the sidebar.",
		defaultValue: false,
	}),
	declareConfig("ui.sidebar_hover_expand", "TOGGLE", {
		path: ["Appearance", "Interface"],
		label: "Sidebar Expand on Hover",
		hint: "Expand the sidebar when hovering over it.",
		effect: (v) => document.body.classList.toggle("seventv-sidebar-hover", v),
		defaultValue: false,
	}),
		declareConfig<number>("ui.sidebar_hover_expand_delay", "SLIDER", {
		path: ["Appearance", "Interface"],
		label: "Sidebar Expand Hover Delay",
		hint: "Change the delay when hovering over the sidebar.",
		options: {
			min: 0,
			max: 1000,
			step: 5,
			unit: "ms",
		},
		defaultValue: 0,
		disabledIf: () => !expandOnHover.value
	}),
];
</script>
<style lang="scss">
.seventv-sidebar-hover {
	/* stylelint-disable */
	.side-nav-card__link__tooltip-arrow {
		display: none !important;
	}
	/* stylelint-enable */

	.side-nav {
		position: absolute;
		z-index: 3;
	}

	.twilight-main {
		margin-left: 5rem;
	}
}
</style>
