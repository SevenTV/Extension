<template>
	<span class="painted-content" :text="text">
		<slot />
	</span>
</template>

<script setup lang="ts">
import { computed, toRef } from "vue";
import { DecimalToStringRGBA } from "@/common/Color";

const props = defineProps<{
	paint: SevenTV.Cosmetic<"PAINT">;
	text: boolean;
}>();

const paint = toRef(props, "paint");

const cssFunction = computed(() => paint.value.data.function.toLowerCase().replace("_", "-"));
const bgImage = computed(() => {
	if (!paint.value) {
		return "";
	}

	const args = [] as string[];
	switch (paint.value.data.function) {
		case "LINEAR_GRADIENT": // paint is linear gradient
			args.push(`${paint.value.data.angle}deg`);
			break;
		case "RADIAL_GRADIENT": // paint is radial gradient
			args.push(paint.value.data.shape ?? "circle");
			break;
		case "URL": // paint is an image
			args.push(paint.value.data.image_url ?? "");
			break;
	}
	let funcPrefix = "";
	if (paint.value.data.function !== "URL") {
		funcPrefix = paint.value.data.repeat ? "repeating-" : "";
	}

	for (const stop of paint.value.data.stops) {
		const color = DecimalToStringRGBA(stop.color);
		args.push(`${color} ${stop.at * 100}%`);
	}

	return `${funcPrefix}${cssFunction.value}(${args.join(", ")})`;
});

const filter = computed(() => {
	if (!paint.value) {
		return "";
	}

	return paint.value.data.shadows
		.map((v) => `drop-shadow(${v.x_offset}px ${v.y_offset}px ${v.radius}px ${DecimalToStringRGBA(v.color)})`)
		.join(" ");
});
</script>

<style scoped lang="scss">
.painted-content > :first-child {
	background-size: cover !important;
	background-color: currentColor;
	background-image: v-bind("bgImage");
	filter: v-bind("filter");
	color: v-bind("paint.data.color");
}

.painted-content[text="true"] > :first-child {
	-webkit-text-fill-color: transparent;
	-webkit-background-clip: text !important;
	background-clip: text !important;
	font-weight: 700;
}
</style>
