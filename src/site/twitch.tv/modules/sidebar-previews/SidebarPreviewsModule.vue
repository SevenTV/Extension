<template>
	<template v-for="inst in sidebarCard.instances" :key="inst.identifier">
		<SidebarCard v-if="showPreviews" :instance="inst" />
	</template>
	<template v-for="inst in sidebarToggle.instances" :key="inst.identifier">
		<SidebarButton v-if="expandOnHover" :inst="inst" :expanded="fullyExpanded" :hovering="isHovering" />
	</template>
</template>

<script setup lang="ts">
import { declareModule } from "@/composable/useModule";
import { declareConfig, useConfig } from "@/composable/useSettings";
import { useComponentHook } from "@/common/ReactHooks";
import SidebarCard from "./SidebarCard.vue";
import { computed, ref, toRef, watch } from "vue";
import { useElementHover, useTimeoutFn } from "@vueuse/core";
import SidebarButton from "./SidebarButton.vue";
import { usePropBinding } from "@/common/Reflection";

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

const sidebarToggle = useComponentHook<Twitch.SideBarToggleComponent>(
	{
		parentSelector: ".side-nav",
		predicate: (n) => n.handleToggleVisibility,
	},
	{ trackRoot: true },
);

const expandOnHover = useConfig<boolean>("ui.sidebar_hover_expand");
const expandTimeout = useConfig<number>("ui.sidebar_hover_expand_timeout");

const btnProps = usePropBinding(() => sidebarToggle.instances.at(0)?.component, { collapsed: true });
const collapsed = toRef(btnProps, "collapsed");
const fullyExpanded = computed(() => !collapsed.value && !isExpanding.value);

let stop: () => void | undefined;
const isExpanding = ref(false);
function toggle([h, conf, c]: [boolean, boolean, boolean]) {
	if (!conf) return;

	const btn = sidebarToggle.instances.at(0)?.component;
	if (!btn) return;

	stop?.();
	if (h !== c) return;

	if (h) {
		btn.handleToggleVisibility();
		isExpanding.value = true;
		useTimeoutFn(() => (isExpanding.value = false), 200);
		return;
	} else if (isExpanding.value) {
		btn.handleToggleVisibility();
		isExpanding.value = false;
	} else {
		stop = useTimeoutFn(btn.handleToggleVisibility, expandTimeout.value).stop;
	}
}

const sidebarEl = ref<Element>();
const isHovering = useElementHover(sidebarEl);
watch([isHovering, expandOnHover, collapsed], toggle, { immediate: true });

watch(
	() => sidebar.instances.at(0)?.domNodes["root"],
	(n) => (sidebarEl.value = n),
	{ immediate: true },
);

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("ui.sidebar_previews", "TOGGLE", {
		path: ["Appearance", "Interface"],
		label: "Sidebar Stream Thumbnails",
		hint: "Show stream thumbnails when hovering over streams on the sidebar.",
		defaultValue: false,
	}),
	declareConfig("ui.sidebar_hover_expand", "TOGGLE", {
		path: ["Appearance", "Interface", 1],
		label: "Sidebar Expand on Hover",
		hint: "Expand the sidebar when hovering over it.",
		effect: (v) => document.body.classList.toggle("seventv-sidebar-hover", v),
		defaultValue: false,
	}),
	declareConfig("ui.sidebar_hover_expand_timeout", "SLIDER", {
		path: ["Appearance", "Interface", 2],
		label: "Sidebar Expand Timeout",
		hint: "Delay in milliseconds before the sidebar collapses.",
		options: {
			min: 0,
			max: 2000,
			step: 100,
			unit: "ms",
		},
		disabledIf: () => !useConfig<boolean>("ui.sidebar_hover_expand").value,
		defaultValue: 0,
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
		transition: width 0.2s ease;

		white-space: nowrap;
		overflow: hidden;
	}

	.twilight-main {
		margin-left: 5rem;
	}
}
</style>
