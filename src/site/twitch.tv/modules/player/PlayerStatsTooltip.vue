<template>
	<div class="seventv-tooltip" tooltip-type="video-stats">
		<div class="details">
			<p>Video: {{ props.width }}x{{ props.height }}</p>
			<p>Framerate: {{ props.framerate }}</p>
			<p>Bitrate: {{ props.bitrate }} kbps</p>
			<p>Dropped Frames: {{ props.droppedFrames }}</p>
			<p>Playback Rate: {{ props.playbackRate.toFixed(2) }}x</p>
			<p>Buffer Size: {{ props.bufferSize.toFixed(2) }}s</p>
		</div>
		<div class="tooltip-title">
			<p>Stream Latency</p>
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
	bufferSize: number;
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

.tooltip-title {
	padding-top: 0.25rem;
	margin-top: 0.25rem;
}
</style>
