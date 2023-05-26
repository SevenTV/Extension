<template>
	<main v-if="view === 'preview'" class="paint-tool-home">
		<div for="heading">
			<h3>Paint Tool</h3>
			<sub>Select Project</sub>
		</div>
		<div class="paint-tool-projects">
			<PaintToolPaintCard v-for="paint of paints" :key="paint.id" :paint="paint" @click="onSelectPaint(paint)" />
			<div class="paint-tool-new-project-button" @click="onNewProject">New Project</div>
		</div>
	</main>

	<PaintToolMaker v-else-if="view === 'maker'" :id="selectedPaint" @exit="onMakerExit" @save="onMakerSave" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { watchEffect } from "vue";
import { getCosmetics, updatePaintStyle } from "@/composable/useCosmetics";
import PaintToolMaker from "./PaintToolMaker.vue";
import PaintToolPaintCard from "./PaintToolPaintCard.vue";

type PaintToolView = "maker" | "preview";

const { cosmetics } = getCosmetics();

const view = ref<PaintToolView>("preview");
const selectedPaint = ref<string | null>(null);
const paints = ref<SevenTV.Cosmetic<"PAINT">[]>([]);

function onSelectPaint(paint: SevenTV.Cosmetic<"PAINT">) {
	view.value = "maker";
	selectedPaint.value = paint.id;
}

function onMakerExit() {
	view.value = "preview";
	selectedPaint.value = null;
}

function onMakerSave(paint: SevenTV.Cosmetic<"PAINT">): void {
	cosmetics[paint.id] = paint;

	updatePaintStyle(paint);
}

function onNewProject() {
	view.value = "maker";
	selectedPaint.value = null;
}

function reload() {
	paints.value = Object.values(cosmetics).filter((c) => c.kind === "PAINT") as SevenTV.Cosmetic<"PAINT">[];
}

watchEffect(reload);
</script>

<style scoped lang="scss">
main.paint-tool-home {
	display: grid;
	height: 100%;
	grid-template-rows: min-content 1fr;
	row-gap: 1rem;
	grid-template-areas:
		"heading"
		"projects";
	overflow: auto;

	div[for="heading"] {
		grid-area: heading;
		background-color: var(--seventv-background-shade-3);
		padding: 1rem 1.5rem;
		border-bottom: 0.1rem solid var(--seventv-primary);

		sub {
			font-size: 1.25rem;
			color: var(--seventv-muted);
		}
	}
}

.paint-tool-projects {
	grid-area: projects;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 1rem;
	align-content: start;
	justify-items: center;
	padding-bottom: 2rem;
}

.paint-tool-new-project-button {
	width: 24rem;
	height: 4rem;
	display: grid;
	place-items: center;
	background-color: var(--seventv-background-shade-2);
	border-radius: 0.25rem;
	cursor: pointer;

	&:hover {
		background-color: var(--seventv-background-shade-3);
	}
}
</style>
