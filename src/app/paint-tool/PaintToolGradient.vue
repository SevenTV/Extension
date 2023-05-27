<template>
	<div class="seventv-paint-tool-gradient" @wheel.stop>
		<div class="seventv-paint-tool-gradient-stop-metadata">
			<select v-model="data.function" v-tooltip="'Generator'" for="function">
				<option value="LINEAR_GRADIENT">Linear Gradient</option>
				<option value="RADIAL_GRADIENT">Radial Gradient</option>
				<option value="CONIC_GRADIENT">Conic Gradient</option>
				<option value="URL">Image URL</option>
			</select>

			<select v-model="data.canvas_repeat" v-tooltip="'Canvas Repeat Mode'" for="repeat-mode">
				<option value="no-repeat">No Repeat</option>
				<option value="repeat">Repeat All</option>
				<option value="repeat-x">Repeat Horizontally</option>
				<option value="repeat-y">Repeat Vertically</option>
				<option value="round">Round</option>
				<option value="space">Space</option>
			</select>

			<input
				v-if="data.function === 'LINEAR_GRADIENT'"
				v-model.number="data.angle"
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

			<div for="control">
				<p>Gradient #{{ id }}</p>

				<CloseIcon @click="emit('delete')" />
			</div>

			<div v-if="data.at" for="pos">
				<label>Position</label>
				<input v-model.number="data.at[0]" v-tooltip="'X Position'" type="number" step="0.01" />
				<input v-model.number="data.at[1]" v-tooltip="'Y Position'" type="number" step="0.01" />
			</div>

			<div v-if="data.size" for="scale">
				<label>Scale</label>
				<input v-model.number="data.size[0]" v-tooltip="'Width'" type="number" step="0.01" min="0" />
				<input v-model.number="data.size[1]" v-tooltip="'Height'" type="number" step="0.01" min="0" />
			</div>

			<div for="stop-repeat">
				<label>Repeat Stops</label>
				<input v-model="data.repeat" type="checkbox" />
			</div>
		</div>

		<div v-if="data.function !== 'URL'" class="seventv-paint-tool-gradient-stop-list">
			<PaintToolGradientStop v-model.lazy="data.stops" />
		</div>

		<div class="seventv-paint-tool-gradient-outline" :style="{ backgroundImage: bg }" />
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { watchThrottled } from "@vueuse/core";
import { createGradientFromPaint } from "@/composable/useCosmetics";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import PaintToolGradientStop from "./PaintToolGradientStop.vue";

const props = defineProps<{
	id: number;
	data?: SevenTV.CosmeticPaintGradient;
}>();

const emit = defineEmits<{
	(e: "update", data: SevenTV.CosmeticPaintGradient): void;
	(e: "delete"): void;
}>();

const data = reactive<SevenTV.CosmeticPaintGradient>(
	props.data ?? {
		function: "LINEAR_GRADIENT",
		canvas_repeat: "no-repeat",
		size: [1, 1],
		at: [0, 0],
		repeat: false,
		stops: [],
		angle: 90,
		image_url: "",
		shape: "circle",
	},
);

const bg = ref("");
const pos = ref("");

watchThrottled(
	data,
	(v) => {
		[bg.value, pos.value] = createGradientFromPaint(v);

		emit("update", v);
	},
	{ throttle: 50 },
);

onMounted(() => {
	if (!Array.isArray(data.at)) {
		data.at = [0, 0];
	}

	if (!Array.isArray(data.size)) {
		data.size = [1, 1];
	}

	if (!Array.isArray(data.stops)) {
		data.stops = [];
	}

	emit("update", data);
});
</script>

<style scoped lang="scss">
$width: 100%;
$height: 9rem;
$stop-width: 16rem;
$stop-height: 9rem;

.seventv-paint-tool-gradient {
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
	grid-template-rows: 1fr 1fr 1fr;
	grid-template-areas:
		"function arg1 control"
		"pos scale repeat-mode"
		"stop-repeat . .";

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

	select[for="repeat-mode"] {
		grid-area: repeat-mode;
		width: 100%;
		border-radius: 0.25rem;
	}

	input[for="arg1"] {
		grid-area: arg1;
	}

	label {
		justify-self: end;
		font-weight: bold;
	}

	div[for="pos"] {
		grid-area: pos;
	}

	div[for="scale"] {
		grid-area: scale;
	}

	div[for="pos"],
	div[for="scale"] {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		align-items: center;
		justify-self: start;
		column-gap: 0.5rem;
		border-radius: 0.25rem;
	}

	div[for="control"] {
		grid-area: control;
		width: fit-content;
		display: grid;
		grid-template-columns: 1fr 1fr;
		justify-content: space-between;
		justify-self: end;
		justify-items: end;
		padding: 0 1rem;
		margin: 0 1rem;
		align-items: center;
		background-color: hsla(0deg, 0%, 0%, 25%);
		border-radius: 0.25rem;

		svg {
			cursor: pointer;
			color: var(--seventv-warning);
		}
	}

	div[for="stop-repeat"] {
		grid-area: stop-repeat;
		display: grid;
		grid-template-columns: 1fr 2rem;
		align-items: center;
		justify-self: start;
		margin-left: 1rem;
		column-gap: 0.5rem;
	}
}

.seventv-paint-tool-gradient-stop-list {
	grid-area: stops;
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
}

.seventv-paint-tool-gradient-color-preview {
	grid-area: color-preview;
	width: 100%;
	border-radius: 0.25rem;
}
</style>
