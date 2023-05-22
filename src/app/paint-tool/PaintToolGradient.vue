<template>
	<div class="seventv-paint-tool-gradient">
		<div class="seventv-paint-tool-gradient-stop-metadata">
			<select v-model="data.function" v-tooltip="'Generator'" for="function">
				<option value="LINEAR_GRADIENT">Linear Gradient</option>
				<option value="RADIAL_GRADIENT">Radial Gradient</option>
				<option value="CONIC_GRADIENT">Conic Gradient</option>
				<option value="URL">Image URL</option>
			</select>

			<input
				v-if="data.function === 'LINEAR_GRADIENT'"
				v-model="data.angle"
				v-tooltip="'Angle'"
				for="arg1"
				type="number"
			/>
			<input
				v-else-if="data.function === 'RADIAL_GRADIENT'"
				v-model="data.shape"
				v-tooltip="'Shape'"
				type="text"
			/>
			<input v-else-if="data.function === 'URL'" v-model="data.image_url" v-tooltip="'Image URL'" type="text" />

			<div for="pos">
				<input v-if="data.at" v-model="data.at[0]" v-tooltip="'X Position'" type="number" />
				<input v-if="data.at" v-model="data.at[1]" v-tooltip="'Y Position'" type="number" />
			</div>
		</div>

		<div class="seventv-paint-tool-gradient-stop-list">
			<div v-for="(stop, i) of stops" :key="stop.id" class="seventv-paint-tool-gradient-stop" @wheel.stop>
				<input v-model="stop.at" v-tooltip="'Position'" type="number" for="at" step="0.01" />
				<input
					v-model="stop.alpha"
					v-tooltip="'Alpha'"
					type="number"
					for="alpha"
					step="0.025"
					min="0"
					max="1"
					@input="onAlphaChange($event as InputEvent, stop)"
				/>
				<input
					v-tooltip="'Color'"
					type="color"
					for="color"
					:value="DecimalToHex(stop.color, false)"
					@input="onColorChange($event as InputEvent, stop)"
				/>
				<div for="move">
					<ChevronIcon v-if="stops[i - 1]" direction="left" />
					<ChevronIcon v-if="stops[i + 1]" direction="right" />
					<CloseIcon for="close" @click="stops.splice(stops.indexOf(stop), 1)" />
				</div>

				<div
					class="seventv-paint-tool-gradient-color-preview"
					:style="{ backgroundColor: DecimalToStringRGBA(stop.color) }"
				/>
			</div>

			<!-- Add Stop -->
			<button class="seventv-paint-tool-gradient-stop-add" @click="addStop">
				<PlusIcon />
			</button>
		</div>

		<div class="seventv-paint-tool-gradient-outline" :style="{ backgroundImage: bg }" />
	</div>
</template>

<script setup lang="ts">
import { reactive, ref, toRaw, watch } from "vue";
import { DecimalToHex, DecimalToStringRGBA, HexToDecimal } from "@/common/Color";
import { createGradientFromPaint } from "@/composable/useCosmetics";
import ChevronIcon from "@/assets/svg/icons/ChevronIcon.vue";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import PlusIcon from "@/assets/svg/icons/PlusIcon.vue";
import { v4 as uuid } from "uuid";

interface StopData extends SevenTV.CosmeticPaintGradientStop {
	id: string;
	alpha: number;
}

const emit = defineEmits<{
	(e: "update", data: SevenTV.CosmeticPaintGradient): void;
}>();

const data = reactive<SevenTV.CosmeticPaintGradient>({
	function: "LINEAR_GRADIENT",
	repeat: false,
	stops: [],
	angle: 90,
	image_url: "",
	shape: "circle",
	at: [0, 0],
});

const stops = ref<StopData[]>([]);
const bg = ref("");
const pos = ref("");
const alpha = ref(1);

function addStop(): void {
	const s: StopData = stops.value.length
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

watch(data, (v) => {
	[bg.value, pos.value] = createGradientFromPaint(v);

	emit("update", v);
});

watch(stops.value, (v) => {
	data.stops = v.map((s) => ({
		at: s.at,
		color: s.color,
	}));
});
</script>

<style scoped lang="scss">
$width: 100%;
$height: 9rem;
$stop-width: 16rem;
$stop-height: 9rem;

.seventv-paint-tool-gradient {
	padding: 0.5rem;
	display: grid;
	grid-template-columns: 1fr;
	gap: 1rem;
	grid-template-rows: repeat(2, min-content) 3em;
	grid-template-areas:
		"metadata"
		"stops"
		"outline";
	width: $width;
	min-height: $height;
}

.seventv-paint-tool-gradient-outline {
	grid-area: outline;
	width: 100%;
	border-radius: 0.25rem;
}

.seventv-paint-tool-gradient-stop-metadata {
	grid-area: metadata;
	display: grid;
	gap: 1rem;
	grid-template-columns: 1fr 1fr 1fr;
	grid-template-rows: 1fr 1fr;
	grid-template-areas:
		"function arg1 ."
		"pos . .";

	input,
	select {
		background-color: var(--seventv-input-background);
		border: 0.01rem solid var(--seventv-input-border);
		border-radius: 0.25rem;
		color: var(--seventv-text-color-normal);
		padding: 0.5rem;

		&[type="number"] {
			max-width: 6rem;
		}
	}

	select[for="function"] {
		grid-area: function;
		width: 100%;
		border-radius: 0.25rem;
	}

	input[for="arg1"] {
		grid-area: arg1;
	}

	div[for="pos"] {
		grid-area: pos;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		justify-self: start;
		column-gap: 0.5rem;
		border-radius: 0.25rem;
	}
}

.seventv-paint-tool-gradient-stop-list {
	grid-area: stops;
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
}

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
		"close . .";

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

	div[for="move"] {
		grid-area: close;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		font-size: 1.5rem;
		align-items: center;
		color: var(--seventv-warning);

		svg:hover {
			cursor: pointer;
			filter: brightness(1.5);
		}
	}
}

.seventv-paint-tool-gradient-color-preview {
	width: 100%;
	border-top-right-radius: 0.25rem;
	border-bottom-right-radius: 0.25rem;
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
