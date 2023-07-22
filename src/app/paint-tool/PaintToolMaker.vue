<template>
	<main class="seventv-paint-tool">
		<div class="seventv-paint-tool-title">
			<ArrowIcon for="exit-icon" direction="left" @click="[emit('exit'), emit('save', wrapPaint())]" />
			<input v-model="data.name" />

			<!-- Full Preview -->
			<div
				class="seventv-paint-tool-preview seventv-paint full-preview"
				:class="{ 'is-empty': !data.gradients.length }"
				:data-seventv-paint-id="id"
			/>

			<!-- Text Preview -->
			<div class="seventv-paint-tool-preview">
				<span
					v-for="(_, i) in Array(3).fill({})"
					:key="i"
					:style="{ fontSize: `calc(1rem * ${i + 1})` }"
					class="seventv-paint seventv-painted-content"
					:data-seventv-paint-id="id"
					:data-seventv-painted-text="true"
				>
					Preview
				</span>
			</div>
		</div>

		<UiScrollable>
			<div class="seventv-paint-tool-content">
				<div for="paint">
					<UiButton @click="tryOn">TRY ON</UiButton>
					<UiButton @click="onShare">SHARE</UiButton>
					<UiButton @click="onDelete">DELETE</UiButton>

					<div for="color">
						<CloseIcon v-tooltip="'Unset Override Color'" @click="data.color = null" />
						<input
							v-tooltip="'Override Color'"
							type="color"
							:value="data.color ? DecimalToHex(data.color) : null"
							@input="data.color = HexToDecimal(($event.target as HTMLInputElement).value)"
						/>
					</div>
				</div>

				<PaintToolList
					color="#f542c2"
					:component-type="PaintToolGradient"
					grid-area="gradients"
					:data="data.gradients"
					@update="(d) => (data.gradients = d as SevenTV.CosmeticPaintGradient[])"
				/>
				<PaintToolList
					color="#f5e6ce"
					:component-type="PaintToolShadow"
					grid-area="shadows"
					:data="data.shadows"
					@update="(d) => (data.shadows = d as SevenTV.CosmeticPaintShadow[])"
				/>
				<div class="text-mod"></div>
				<div class="text"></div>
				<div class="flair-add"></div>
				<div class="flairs"></div>
			</div>
		</UiScrollable>
	</main>
</template>

<script setup lang="ts">
import { onUnmounted, reactive, ref } from "vue";
import { watchThrottled } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { DecimalToHex, HexToDecimal } from "@/common/Color";
import { db } from "@/db/idb";
import { getCosmetics, updatePaintStyle, useCosmetics } from "@/composable/useCosmetics";
import ArrowIcon from "@/assets/svg/icons/ArrowIcon.vue";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import PaintToolGradient from "./PaintToolGradient.vue";
import PaintToolList from "./PaintToolList.vue";
import PaintToolShadow from "./PaintToolShadow.vue";
import UiButton from "@/ui/UiButton.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import { v4 as uuid } from "uuid";

const props = defineProps<{
	id?: string | null;
}>();

const emit = defineEmits<{
	(e: "exit"): void;
	(e: "save", data: SevenTV.Cosmetic<"PAINT">): void;
}>();

const { cosmetics } = getCosmetics();
const { identity } = storeToRefs(useStore());
const knownPaint = cosmetics[props.id ?? ""] as SevenTV.Cosmetic<"PAINT"> | undefined;

const id = ref(knownPaint ? knownPaint.id : uuid());
const data = reactive<SevenTV.CosmeticPaint>(
	knownPaint?.data ?? {
		name: "Untitled Paint",
		color: 2139062271,
		gradients: [],
		shadows: [],
	},
);

function wrapPaint(): SevenTV.Cosmetic<"PAINT"> {
	return {
		id: id.value,
		kind: "PAINT",
		provider: "7TV",
		data,
	};
}

function tryOn(): void {
	if (!identity.value) return;

	const m = useCosmetics(identity.value.id).paints;
	m.clear();
	m.set(id.value, wrapPaint());
}

function onDelete(): void {
	if (!identity.value) return;

	const m = useCosmetics(identity.value.id).paints;
	m.delete(id.value);
	db.cosmetics.delete(id.value).then(() => emit("exit"));
}

function onShare(): void {
	if (!identity.value) return;

	const code = JSON.stringify(wrapPaint());
	navigator.clipboard.writeText(code);
}

watchThrottled(data, () => updatePaintStyle(wrapPaint()), {
	throttle: 50,
	immediate: true,
});

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
	height: 100%;
}

.seventv-paint-tool-title {
	grid-area: title;
	position: sticky;
	z-index: 1;
	top: 0;
	width: 100%;
	height: 6rem;
	display: grid;
	grid-template-columns: min-content 1fr 1.25fr;
	grid-template-rows: 1fr;
	grid-template-areas: "close input preview";
	column-gap: 0.5rem;
	align-items: center;
	padding: 0 0 0 1rem;
	border-bottom: 0.25rem solid var(--seventv-primary);
	background-color: var(--seventv-background-shade-3);

	[for="exit-icon"] {
		grid-area: close;
		cursor: pointer;
		font-size: 2rem;
	}

	input {
		grid-area: input;
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
		grid-area: preview;
		width: 100%;
		height: 100%;
		border-radius: 0.25rem;
		transition: opacity 0.2s ease-in-out;

		&.full-preview {
			z-index: 1;

			&:hover {
				cursor: zoom-in;
				opacity: 0;
			}
		}

		&:not(.full-preview) {
			font-weight: 700;
			font-size: 2rem;
			display: grid;
			grid-auto-flow: column;
			column-gap: 1rem;
			place-content: center;
			align-items: baseline;
		}

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
	grid-template-columns: 0.25fr 1.5fr 1fr;
	grid-template-rows: repeat(5, min-content);
	grid-template-areas:
		"paint paint paint"
		"gradients-mod gradients gradients"
		"shadows-mod shadows shadows"
		"text-mod text text"
		"flair-add flairs flairs";

	div[for="paint"] {
		grid-area: paint;
		display: grid;
		grid-template-columns: repeat(3, auto);
		justify-content: start;
		gap: 1rem;
		margin: 1rem;

		div[for="color"] {
			display: grid;
			grid-template-columns: auto 1fr;
			align-items: center;
			column-gap: 0.25rem;

			> input {
				outline: none;
				border: none;
				background: none;
				width: 100%;
			}
		}
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
