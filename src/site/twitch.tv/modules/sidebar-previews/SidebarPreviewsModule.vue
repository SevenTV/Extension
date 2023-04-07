<template>
	<template v-for="inst in sidebarCard.instances" :key="inst.identifier">
		<SidebarCard :instance="inst" />
	</template>
</template>

<script setup lang="ts">
import { declareModule } from "@/composable/useModule";
import { declareConfig } from "@/composable/useSettings";
import { useComponentHook } from "@/common/ReactHooks";
import SidebarCard from "./SidebarCard.vue";

const { markAsReady } = declareModule("sidebar-previews", {
	name: "Sidebar Previews",
	depends_on: ["settings"],
});

const sidebarCard = useComponentHook<Twitch.SidebarCardComponent>({
	parentSelector: ".side-nav-section",
	predicate: (n) => n.props && n.props.title && n.props.isWatchParty !== null && n.props.linkTo,
});

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
];
</script>
