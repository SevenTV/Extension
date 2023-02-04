<template />

<script setup lang="ts">
import { ref } from "vue";
import { until, useTimeoutFn } from "@vueuse/shared";
import { debounceFn } from "@/common/Async";
import { log } from "@/common/Logger";
import { HookedInstance, useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import { useConfig } from "@/composable/useSettings";

const { dependenciesMet, markAsReady } = declareModule("autoclaim", {
	name: "Autoclaim",
	depends_on: ["chat"],
	config: [
		{
			key: "general.autoclaim.channel_points",
			label: "Autoclaim Channel Points",
			hint: "Automatically claim your channel point bonus when it becomes available.",
			path: ["Channel", "Autoclaim"],
			type: "TOGGLE",
			defaultValue: false,
		},
	],
});
await until(dependenciesMet).toBe(true);

const isEnabled = useConfig<boolean>("general.autoclaim.channel_points");

useComponentHook<Twitch.ChatChannelPointsClaimComponent>(
	{
		parentSelector: ".community-points-summary",
		predicate: (el) => el.props && el.props.claimCommunityPoints,
	},
	{
		hooks: {
			render(inst, cur) {
				if (!isEnabled.value) return cur;
				if (!inst.component.onClick || !cur) return cur;

				const props = (cur as ReactExtended.ReactRuntimeElement).props ?? {};
				if (props.children && props.children.props?.show) {
					doClaim(inst);
				}

				return cur;
			},
		},
	},
);

const lock = ref(false);
const doClaim = debounceFn(async (inst: HookedInstance<Twitch.ChatChannelPointsClaimComponent>) => {
	if (lock.value || typeof inst.component.onClick !== "function") return;

	inst.component.onClick();

	// Prevent further clicks while the button is reverting to its original state
	lock.value = true;
	useTimeoutFn(() => (lock.value = false), 1e4);

	log.debug("Claimed channel point bonus");
}, 1000);

markAsReady();
</script>
