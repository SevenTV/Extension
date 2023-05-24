<template>
	<div class="seventv-paint-tool-shadow" @wheel.stop>
		<div for="preview" :style="{ filter: preview }">
			<CloseIcon @click="emit('delete')" />
			<span>Shadow #{{ id }}</span>
		</div>
		<div for="offset">
			<input v-model="data.x_offset" v-tooltip="'X Offset'" type="number" step="0.05" />
			<input v-model="data.y_offset" v-tooltip="'Y Offset'" type="number" step="0.05" />
		</div>
		<div for="radius">
			<input v-model="data.radius" v-tooltip="'Radius'" type="number" step="0.05" min="0" />
		</div>
		<div for="alpha">
			<input
				v-model="alpha"
				v-tooltip="'Alpha'"
				type="number"
				min="0"
				max="1"
				step="0.025"
				@input="onAlphaChange($event as InputEvent)"
			/>
		</div>
		<div for="color">
			<input
				v-tooltip="'color'"
				type="color"
				:value="DecimalToHex(data.color, false)"
				@input="onColorChange($event as InputEvent)"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { reactive } from "vue";
import { watch } from "vue";
import { DecimalToHex, HexToDecimal } from "@/common/Color";
import { createFilterDropshadow } from "@/composable/useCosmetics";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";

defineProps<{
	id: number;
}>();

const emit = defineEmits<{
	(e: "update", data: SevenTV.CosmeticPaintShadow): void;
	(e: "delete"): void;
}>();

const data = reactive<SevenTV.CosmeticPaintShadow>({
	x_offset: 0,
	y_offset: 0,
	radius: 1,
	color: 255,
});

const alpha = ref(1);
const preview = ref<string>("");

function onColorChange(ev: InputEvent): void {
	if (!(ev.target instanceof HTMLInputElement)) return;

	data.color = HexToDecimal(ev.target.value, alpha.value);
}

function onAlphaChange(ev: InputEvent): void {
	if (!(ev.target instanceof HTMLInputElement)) return;

	const alpha = ev.target.valueAsNumber * 255;
	data.color = (data.color & 0xffffff00) | (alpha & 0xff);
}

watch(data, (v) => {
	emit("update", v);

	preview.value = createFilterDropshadow(v);
});
</script>

<style scoped lang="scss">
.seventv-paint-tool-shadow {
	padding: 0.5rem;
	height: 12rem;
	width: 22.5rem;
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	grid-template-rows: repeat(3, 1fr);
	grid-template-areas:
		"preview preview offset offset"
		"alpha color color color"
		"radius color color color";
	background-color: var(--seventv-background-shade-2);

	input {
		background-color: var(--seventv-input-background);
		border: 0.01rem solid var(--seventv-input-border);
		border-radius: 0.25rem;
		color: var(--seventv-text-color-normal);
		padding: 0.5rem;

		&[type="number"] {
			max-width: 6rem;
		}
	}

	> div {
		align-self: center;
	}

	div[for="preview"] {
		grid-area: preview;
		font-weight: 700;
		font-size: 1.15rem;

		> :first-child {
			margin-right: 0.25rem;
		}

		span,
		svg {
			vertical-align: middle;
		}

		svg:hover {
			cursor: pointer;
		}
	}

	div[for="offset"] {
		grid-area: offset;
		display: grid;
		grid-auto-flow: column;
		justify-content: end;
		gap: 0.5rem;
	}

	div[for="radius"] {
		grid-area: radius;
	}

	div[for="alpha"] {
		grid-area: alpha;
	}

	div[for="color"] {
		grid-area: color;
		height: 100%;
		display: grid;
		justify-items: center;

		input {
			height: 100%;
			width: 75%;
			background: none;
			border: none;
		}
	}
}
</style>
