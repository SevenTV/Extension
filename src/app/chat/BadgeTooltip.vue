<template>
	<template v-if="compactTooltips">
		<div ref="tooltip" class="seventv-tooltip-compact" tooltip-type="badge">
			<p>{{ alt }}</p>
		</div>
	</template>
	<template v-else>
		<div ref="tooltip" class="seventv-tooltip" tooltip-type="badge">
			<img
				ref="imgRef"
				class="tooltip-badge"
				:src="initSrc"
				:srcset="srcset"
				:alt="alt"
				:style="{
					width,
					height,
				}"
			/>

			<div class="details">
				<h3 class="badge-name">{{ alt }}</h3>
			</div>
		</div>
	</template>
</template>

<script setup lang="ts">
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	alt: string;
	initSrc?: string;
	src: string;
	width: number;
	height: number;
}>();

const compactTooltips = useConfig("ui.compact_tooltips");

const width = `${props.width * 4}px`;
const height = `${props.height * 4}px`;

const srcset = imageHostToSrcset(props.height, props.width, props.src);

function imageHostToSrcset(height: number, width: number, srcset: string): string {
	let clean = "";
	for (let i = 0; i < 3; i++) {
		const src = srcset.split(",")[i];
		const [url, sizeString] = src.trim().split(" ");

		const size = parseInt(sizeString.replace("x", ""));

		clean += `${url} ${width * size}w ${height * size}h, `;
	}
	return clean;
}
</script>

<style scoped lang="scss">
.seventv-tooltip {
	width: max-content;
	display: flex;
	flex-direction: column;
	align-items: center;
	max-width: 21rem;
	padding: 0.5rem 1.15rem;
}

.seventv-tooltip-compact {
	background-color: rgba(0, 0, 0, 0.65%);

	@at-root .seventv-transparent & {
		backdrop-filter: blur(0.25em);
	}

	border-radius: 0.33em;
	padding: 0.25em;
}

.badge-name {
	font-size: 1.25rem;
	font-weight: 150;
	max-width: 15rem;
	word-break: break-word;
	float: left;
	text-align: center;
}

img.tooltip-badge {
	margin-bottom: 1rem;
	margin-top: 1rem;
}
</style>
