<template>
	<Transition name="settings-menu" appear>
		<SettingsMenu v-if="ctx.open" />
	</Transition>

	<template v-for="inst of topnav.instances" :key="inst.identifier">
		<SettingsMenuButton :inst="inst" @toggle="ctx.open = !ctx.open" />
	</template>
</template>

<script setup lang="ts">
import { declareModule } from "@/composable/useModule";
import { useSettingsMenu } from "@/app/settings/Settings";
import SettingsMenuButton from "./SettingsMenuButton.vue";
import SettingsMenu from "../../../../app/settings/SettingsMenu.vue";
import { declareConfig } from "@/composable/useSettings";
import { useComponentHook } from "@/common/ReactHooks";

const { markAsReady } = declareModule("settings", {
	name: "Settings",
	depends_on: [],
});

const ctx = useSettingsMenu();

// hook for the top nav bar
const topnav = useComponentHook<Twitch.TopNavBarComponent>(
	{
		predicate: (n) => n.props && n.props.isWhispersLoaded && n.props.languageCode,
		maxDepth: 100,
	},
	{
		trackRoot: true,
	},
);

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("ui.transparent_backgrounds", "TOGGLE", {
		path: ["Appearance", "Interface"],
		label: "Use UI transparency",
		hint: "If checked some backgrounds will be transparent and blurred. This may affect performance",
		defaultValue: true,
	}),
];
</script>

<style scoped lang="scss">
.settings-menu-enter-active,
.settings-menu-leave-active {
	transition: opacity 120ms;
}

.settings-menu-enter-from,
.settings-menu-leave-to {
	opacity: 0;
}
</style>
