<template />

<script setup lang="ts">
import { watchEffect } from "vue";
import { HookedInstance } from "@/common/ReactHooks";

const props = defineProps<{
	inst: HookedInstance<Twitch.FollowedSideNavList>;
}>();

// Currently this only auto-expands once
watchEffect(() => {
	if (!props.inst.domNodes) return;
	const rootNode = props.inst.domNodes.root;
	const showMoreButton = rootNode.querySelector<HTMLElement>("button[data-a-target='side-nav-show-more-button']");
	if (!showMoreButton) return;
	showMoreButton.click();
});
</script>
