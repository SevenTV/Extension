<template>
	<main id="seventv-float-context">
		<div v-for="screen of ctx.screens" :key="screen.sym" class="seventv-float-screen-parent">
			<FloatScreen :screen="screen" @container-created="onContainerCreated" />
		</div>
	</main>
</template>

<script setup lang="ts">
import { useFloatContext } from "@/composable/useFloatContext";
import FloatScreen from "./FloatScreen.vue";

const ctx = useFloatContext();

function onContainerCreated(screenID: symbol, container: Element): void {
	const screen = ctx.screenMap[screenID];
	if (!screen) return;

	screen.teleportContainer = container;
}
</script>
