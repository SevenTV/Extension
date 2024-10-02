<template>
	<main v-if="view === 'preview'" class="paint-tool-home">
		<div for="heading">
			<h3>Paint Tool</h3>
			<div ref="shareButton">
				<UiButton @click="onImport">IMPORT...</UiButton>
			</div>
			<h6 style="color: red">
				⚠️ Paints you try on here will not be visible to other users and are not permanent. To actually change
				your paint, go to 'Edit Profile' on 7tv.app.
			</h6>
			<br /><br /><br /><br />
			<sub>Select Project</sub>
		</div>
		<UiScrollable>
			<div class="paint-tool-projects">
				<PaintToolPaintCard
					v-for="paint of paints"
					:key="paint.id"
					:paint="paint"
					@click="selectPaint(paint)"
				/>
				<div class="paint-tool-new-project-button" @click="newProject">New Project</div>
			</div>
		</UiScrollable>
	</main>

	<template v-if="shareButton">
		<UiFloating
			v-if="share.prompt && shareButton"
			:anchor="shareButton"
			placement="bottom"
			:middleware="[offset(4)]"
		>
			<input v-model="share.value" placeholder="Import Code" :autofocus="true" @keydown.enter="onImport" />
		</UiFloating>

		<UiFloating v-if="share.error" :anchor="shareButton" placement="left" :middleware="[offset(8)]">
			<p>{{ share.error }}</p>
		</UiFloating>
	</template>

	<PaintToolMaker v-else-if="view === 'maker'" :id="selectedPaint" @exit="exitMaker" @save="saveProject" />
</template>

<script setup lang="ts">
import { ref, watch, watchEffect } from "vue";
import { reactive } from "vue";
import { refAutoReset } from "@vueuse/core";
import { db } from "@/db/idb";
import { getCosmetics } from "@/composable/useCosmetics";
import PaintToolMaker from "./PaintToolMaker.vue";
import PaintToolPaintCard from "./PaintToolPaintCard.vue";
import UiButton from "@/ui/UiButton.vue";
import UiFloating from "@/ui/UiFloating.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import { offset } from "@floating-ui/dom";

type PaintToolView = "maker" | "preview";

const { cosmetics } = getCosmetics();
const view = ref<PaintToolView>("preview");
const selectedPaint = ref<string | null>(null);
const paints = ref<SevenTV.Cosmetic<"PAINT">[]>([]);
const shareButton = ref<HTMLElement | null>(null);
const share = reactive({
	prompt: false,
	value: "",
	error: refAutoReset("", 2500),
});

function selectPaint(paint: SevenTV.Cosmetic<"PAINT">) {
	view.value = "maker";
	selectedPaint.value = paint.id;
}

function exitMaker() {
	view.value = "preview";
	selectedPaint.value = null;
}

async function saveProject(paint: SevenTV.Cosmetic<"PAINT">) {
	cosmetics[paint.id] = paint;

	const ret = db.cosmetics.put(JSON.parse(JSON.stringify(paint)));
	ret.then(reload);

	return ret;
}

function newProject() {
	view.value = "maker";
	selectedPaint.value = null;
}

async function onImport() {
	share.error = "";

	const isPrompt = share.prompt;
	const txt = isPrompt ? share.value : await navigator.clipboard.readText().catch(() => "");
	share.value = "";
	share.prompt = false;

	if (!txt) {
		share.prompt = true;
	}

	let data: SevenTV.Cosmetic<"PAINT">;
	try {
		data = JSON.parse(txt);
	} catch (e) {
		share.prompt = !isPrompt;
		share.error = "Invalid JSON: " + (e as Error).message;
		return;
	}

	if (!validateImport(data)) {
		share.prompt = true;
		share.error = "Invalid Paint Data";
		return;
	}

	await saveProject(data);
	share.prompt = false;
}

function validateImport(paint: SevenTV.Cosmetic<"PAINT">): boolean {
	if (!paint.id) return false;
	if (typeof paint.data !== "object") return false;
	if (typeof paint.data.name !== "string") return false;

	return true;
}

function reload() {
	db.cosmetics
		.where("kind")
		.equals("PAINT")
		.toArray()
		.then((cos) => {
			paints.value = cos as SevenTV.Cosmetic<"PAINT">[];
		});
}

watchEffect(reload);
watch(view, reload);
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
		display: grid;
		grid-template-columns: 1fr min-content;
		align-items: center;
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
