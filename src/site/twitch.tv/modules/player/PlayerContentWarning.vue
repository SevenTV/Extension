<template />

<script setup lang="ts">
import { log } from "@/common/Logger";
import { HookedInstance } from "@/common/ReactHooks";
import { definePropertyHook } from "@/common/Reflection";

const props = defineProps<{
	inst: HookedInstance<Twitch.VideoPlayerContentRestriction>;
}>();

definePropertyHook(props.inst.component, "props", {
	value(v) {
		const fn = v.children?.props?.onAcknowledge;
		if (typeof fn === "function") {
			fn();

			log.info("<Player>", "Acknowledged content warning", `(${v.restriction})`);
		}
	},
});
</script>
