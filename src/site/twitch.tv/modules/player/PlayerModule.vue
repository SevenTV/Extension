<template>
	<template v-for="inst of player.instances" :key="inst.identifier">
		<PlayerController :inst="inst" />
	</template>
</template>

<script setup lang="ts">
import { useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import { declareConfig } from "@/composable/useSettings";
import PlayerController from "./PlayerController.vue";

declareModule<"TWITCH">("player", {
	name: "Player",
	depends_on: [],
});

const player = useComponentHook<Twitch.VideoPlayerComponent>(
	{
		predicate: (n) => n.props && n.props.containerRef && n.props.mediaPlayerInstance,
	},
	{
		hooks: {
			render(inst, cur) {
				return cur;
			},
		},
	},
);
</script>

<script lang="ts">
export const config = [
	declareConfig("player.skip_content_restriction", "TOGGLE", {
		label: "Skip Content Warnings",
		hint: "Automatically skip the 'intended for mature audiences' dialog on some streams",
		path: ["Player", ""],
		defaultValue: false,
	}),
];
</script>
