<template>
	<template v-for="(stop, i) of stops" :key="stop.id">
		<div class="seventv-paint-tool-gradient-stop">
			<input v-model.number="stops[i].at" v-tooltip="'Position'" type="number" for="at" step="0.01" />
			<input
				v-model="stops[i].alpha"
				v-tooltip="'Alpha'"
				type="number"
				for="alpha"
				step="0.025"
				min="0"
				max="1"
				@input="onAlphaChange($event as InputEvent, stops[i])"
			/>
			<input
				v-tooltip="'Color'"
				type="color"
				for="color"
				:value="DecimalToHex(stops[i].color, false)"
				@input="onColorChange($event as InputEvent, stops[i])"
			/>
			<div for="move">
				<ChevronIcon
					v-if="stops[i - 1]"
					v-tooltip="'<- #' + (i - 1)"
					direction="left"
					@click="stops.splice(i - 1, 0, stops.splice(i, 1)[0])"
				/>
				<ChevronIcon
					v-if="stops[i + 1]"
					v-tooltip="'-> #' + (i + 1)"
					direction="right"
					@click="stops.splice(i + 1, 0, stops.splice(i, 1)[0])"
				/>
				<CloseIcon v-tooltip="'Delete Stop #' + i" for="close" @click="stops.splice(i, 1)" />
			</div>
			<p for="n">#{{ i }}</p>

			<div
				v-if="stops[i].alpha < 1"
				class="seventv-paint-tool-gradient-color-preview"
				:style="{ backgroundColor: DecimalToStringRGBA(stops[i].color) }"
			/>
		</div>
	</template>

	<!-- Add Stop -->
	<button class="seventv-paint-tool-gradient-stop-add" @click="addStop">
		<PlusIcon />
	</button>
</template>

<script setup lang="ts">
import { onMounted, ref, toRaw } from "vue";
import { watchThrottled } from "@vueuse/core";
import { DecimalToHex, DecimalToStringRGBA, HexToDecimal } from "@/common/Color";
import ChevronIcon from "@/assets/svg/icons/ChevronIcon.vue";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import PlusIcon from "@/assets/svg/icons/PlusIcon.vue";
import { v4 as uuid } from "uuid";

export interface PaintToolStopData extends SevenTV.CosmeticPaintGradientStop {
	id: string;
	alpha: number;
}

const props = defineProps<{
	modelValue: SevenTV.CosmeticPaintGradientStop[];
}>();

const emit = defineEmits<{
	(e: "update:modelValue", data: SevenTV.CosmeticPaintGradientStop[]): void;
}>();

const stops = ref<PaintToolStopData[]>([]);
const alpha = ref(1);

function addStop(): void {
	const s: PaintToolStopData = stops.value.length
		? structuredClone(toRaw(stops.value[stops.value.length - 1]))
		: {
				id: uuid(),
				at: 0,
				color: 0,
				alpha: 1,
			};

	stops.value.push(s);
}

function onColorChange(ev: InputEvent, stop: SevenTV.CosmeticPaintGradientStop): void {
	if (!(ev.target instanceof HTMLInputElement)) return;

	stop.color = HexToDecimal(ev.target.value, alpha.value);
}

function onAlphaChange(ev: InputEvent, stop: SevenTV.CosmeticPaintGradientStop): void {
	if (!(ev.target instanceof HTMLInputElement)) return;

	const alpha = ev.target.valueAsNumber * 255;
	stop.color = (stop.color & 0xffffff00) | (alpha & 0xff);
}

watchThrottled(
	stops.value,
	(v) => {
		emit(
			"update:modelValue",
			v.map((s) => ({ at: s.at, color: s.color })),
		);
	},
	{
		throttle: 50,
	},
);

onMounted(() => {
	for (const stop of props.modelValue ?? []) {
		stops.value.push({
			id: uuid(),
			at: stop.at,
			color: stop.color,
			alpha: (stop.color & 0xff) / 255,
		});
	}
});
</script>

<style scoped lang="scss">
$stop-width: 16rem;
$stop-height: 9rem;

.seventv-paint-tool-gradient-stop {
	// https://grid.layoutit.com/?id=g6zmIKv
	background: hsla(0deg, 0%, 0%, 25%);
	border-top-left-radius: 0.25rem;
	border-bottom-left-radius: 0.25rem;
	display: grid;
	gap: 0.5rem;
	padding: 0.5rem;
	grid-template-columns: 1.5fr 1fr 1fr;
	grid-template-rows: 1fr 1fr 1fr;
	width: $stop-width;
	height: $stop-height;
	grid-template-areas:
		"pos color color"
		"alpha color color"
		"close n color-preview";

	input {
		background: none;
		border: none;
		outline: none;
		color: currentcolor;
		padding-left: 0.25rem;
		font-size: 1.5rem;
		width: 100%;
	}

	input[type="number"] {
		border-bottom: 0.1rem solid currentcolor;
	}

	input[for="at"] {
		grid-area: pos;
	}

	input[for="color"] {
		grid-area: color;
		height: 100%;
	}

	input[for="alpha"] {
		grid-area: alpha;
	}

	p[for="n"] {
		grid-area: n;
		color: var(--seventv-muted);
		align-self: center;
		justify-self: center;
	}

	div[for="move"] {
		grid-area: close;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		font-size: 1.5rem;
		align-items: center;
		color: var(--seventv-primary);

		> :last-child {
			color: var(--seventv-warning);
		}

		svg:hover {
			cursor: pointer;
			filter: brightness(1.5);
		}
	}
}

.seventv-paint-tool-gradient-stop-add {
	width: $stop-width;
	height: $stop-height;
	background: hsla(0deg, 0%, 0%, 25%);
	border-radius: 0.25rem;
	display: grid;
	place-items: center;
	font-size: 3rem;
	color: currentcolor;
	transition: filter 0.2s ease-in-out;

	&:hover {
		cursor: pointer;
		outline: 0.1rem solid currentcolor;
	}
}
</style>
