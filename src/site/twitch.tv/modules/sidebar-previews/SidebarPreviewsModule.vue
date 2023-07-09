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
import { toRaw, watch } from "vue";

const { markAsReady } = declareModule("sidebar-previews", {
	name: "Sidebar Previews",
	depends_on: ["settings"],
});

const showPreviews = useConfig<boolean>("ui.sidebar_previews");
const hideOfflineChannels = useConfig<boolean>("layout.hide_sidebar_offline_channels");

watch(hideOfflineChannels, () => sidebarCard.instances.forEach((inst) => toRaw(inst.component).forceUpdate()));

const sidebarCard = useComponentHook<Twitch.SidebarCardComponent>(
	{
		parentSelector: ".side-nav-section",
		predicate: (n) => n.props && n.props.title && n.props.isWatchParty !== null && n.props.linkTo,
	},
	{
		hooks: {
			render(inst, cur) {
				if (inst.component.props.offline && hideOfflineChannels.value) return null;
				return cur;
			},
		},
	},
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
	declareConfig("layout.hide_sidebar_offline_channels", "TOGGLE", {
		path: ["Site Layout", "Sidebar"],
		label: "Hide Offline Channels",
		hint: "If checked, offline channels in side bar will be hidden",
		defaultValue: false,
	}),
];
</script>
