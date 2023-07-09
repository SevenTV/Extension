<template>
	<template v-for="inst of followedSideNavList.instances" :key="inst.identifier">
		<FollowedSideNav :inst="inst" />
	</template>
	<template v-for="inst of sideNavList.instances" :key="inst.identifier">
		<SideNav :inst="inst" />
	</template>
</template>

<script setup lang="ts">
import { useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import FollowedSideNav from "./FollowedSideNav.vue";
import SideNav from "./SideNav.vue";
import { declareConfig, useConfig } from "@/composable/useSettings";
import { toRaw, watch } from "vue";

declareModule<"TWITCH">("side-nav", {
	name: "Side Nav",
	depends_on: [],
});

const hideRecommendedChannels = useConfig<boolean>("layout.hide_recommended_channels");
const hideViewersAlsoWatch = useConfig<boolean>("layout.hide_viewers_also_watch");

const followedSideNavList = useComponentHook<Twitch.FollowedSideNavList>(
	{
		parentSelector: ".side-bar-contents",
		predicate: (n) => n.props && n.props.title && n.props.OnlineChannelRenderer && n.props.sort,
	},
	{
		trackRoot: true,
	},
);

watch(hideRecommendedChannels, () => sideNavList.instances.forEach((inst) => toRaw(inst.component).forceUpdate()));
watch(hideViewersAlsoWatch, () => sideNavList.instances.forEach((inst) => toRaw(inst.component).forceUpdate()));

// we might need a better predicate here to distinguish between followed channels and other sections
// the followed section has a sort property that makes it unique (otherwise they are very similar)
const sideNavList = useComponentHook<Twitch.SideNavList>(
	{
		parentSelector: ".side-bar-contents",
		predicate: (n) => n.props && n.props.title && n.props.initialDisplayAmount && n.props.maxDisplayCount,
	},
	{
		trackRoot: true,
		hooks: {
			render(inst, cur) {
				if (inst.component.props.section.type === "RECOMMENDED_SECTION" && hideRecommendedChannels.value)
					return null;
				if (inst.component.props.section.type === "SIMILAR_SECTION" && hideViewersAlsoWatch.value) return null;
				return cur;
			},
		},
	},
);
</script>

<script lang="ts">
export const config = [
	declareConfig("layout.auto_expand_sidebar", "TOGGLE", {
		path: ["Site Layout", "Sidebar"],
		label: "Auto Expand Channels",
		hint: "If checked, sidebar sections will be automatically expanded to show more",
		defaultValue: false,
	}),
];
</script>
