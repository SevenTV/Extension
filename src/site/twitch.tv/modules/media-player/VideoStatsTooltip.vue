<template>
	<div ref="tooltip" class="seventv-tooltip" tooltip-type="video-stats">
		<div class="details">
			<p>Video: {{ props.width }}x{{ props.height }}p{{ props.framerate }}</p>
			<p>Bitrate: {{ props.bitrate }} kbps</p>
			<p>Dropped Frames: {{ props.droppedFrames }}</p>
			<br />
			<p>Stream Latency</p>
			<p v-if="props.playbackRate > 1">Playing at {{ props.playbackRate.toFixed(2) }}x to reduce delay</p>
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	bitrate: string;
	playbackRate: number;
	droppedFrames: number;
	height: number;
	width: number;
	framerate: number;
}>();
</script>

<style scoped lang="scss">
.seventv-tooltip {
	text-align: center;
	padding: 0.5em 1.15em;
	min-width: 12em;
}
.details {
	padding-bottom: 0.25rem;
	margin-bottom: 0.25rem;
}
</style>
