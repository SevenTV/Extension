<template>
	<main class="seventv-paint-tool">
		<div class="seventv-paint-tool-title">
			<input v-model="data.name" />

			<div
				class="seventv-paint-tool-preview seventv-paint"
				:class="{ 'is-empty': !data.gradients.length }"
				:data-seventv-paint-id="id"
			/>
		</div>

		<div class="seventv-paint-tool-content">
			<div class="canvas"></div>
			<PaintToolList color="#f542c2" :component-type="PaintToolGradient" grid-area="gradients" />
			<PaintToolList color="#f5e6ce" :component-type="PaintToolGradient" grid-area="shadows" />
			<div class="shadow-add"></div>
			<div class="shadows"></div>
			<div class="text-mod"></div>
			<div class="text"></div>
			<div class="flair-add"></div>
			<div class="flairs"></div>
		</div>
	</main>
</template>

<script setup lang="ts">
import { onUnmounted, reactive, ref, watch } from "vue";
import { updatePaintStyle } from "@/composable/useCosmetics";
import PaintToolGradient from "./PaintToolGradient.vue";
import PaintToolList from "./PaintToolList.vue";
import { v4 as uuid } from "uuid";

const id = ref(uuid());
const data = reactive<SevenTV.CosmeticPaint>({
	name: "Untitled Paint",
	color: null,
	canvas_size: null,
	canvas_repeat: "",
	gradients: [],
	shadows: [],
});

function wrapPaint(): SevenTV.Cosmetic<"PAINT"> {
	return {
		id: id.value,
		kind: "PAINT",
		provider: "7TV",
		data,
	};
}

watch(data, () => updatePaintStyle(wrapPaint()));

onUnmounted(() => updatePaintStyle(wrapPaint(), true));
</script>

<style scoped lang="scss">
// https://grid.layoutit.com/?id=smUVqyB

main.seventv-paint-tool {
	display: grid;
	grid-template-rows: min-content 1fr;
	grid-template-areas:
		"title"
		"content";
	overflow: auto;
	height: 100%;
}

.seventv-paint-tool-title {
	grid-area: title;
	position: sticky;
	top: 0;
	width: 100%;
	height: 6rem;
	display: grid;
	grid-template-columns: 1.25fr 0.75fr;
	grid-template-rows: 1fr;
	align-items: center;
	padding: 0 0 0 1rem;
	border-bottom: 0.25rem solid var(--seventv-primary);
	background-color: var(--seventv-background-shade-3);

	input {
		outline: none;
		border: none;
		background: none;
		height: 100%;
		color: currentcolor;
		font-size: 2rem;
		font-weight: 700;
	}

	h3[entry="true"]::after {
		content: "Untitled Paint";
		color: var(--seventv-text-shade-1);
	}

	.seventv-paint-tool-preview {
		width: 100%;
		height: 100%;
		border-radius: 0.25rem;

		&.is-empty {
			background-image: repeating-linear-gradient(
				45deg,
				var(--seventv-background-shade-2),
				var(--seventv-background-shade-2) 1rem,
				transparent 1rem,
				transparent 2rem
			);
		}
	}
}

.seventv-paint-tool-content {
	grid-area: content;
	display: grid;
	margin: 1rem 0;
	grid-template-columns: 0.25fr 1.5fr 1fr;
	grid-template-rows: repeat(5, min-content);
	grid-template-areas:
		"canvas canvas canvas"
		"gradients-mod gradients gradients"
		"shadows-mod shadows shadows"
		"text-mod text text"
		"flair-add flairs flairs";

	.canvas {
		grid-area: canvas;
	}

	.shadows-mod {
		grid-area: shadow-add;
	}

	.shadows {
		grid-area: shadows;
	}

	.text-mod {
		grid-area: text-mod;
	}

	.text {
		grid-area: text;
	}

	.flair-add {
		grid-area: flair-add;
	}

	.flairs {
		grid-area: flairs;
	}
}
</style>
