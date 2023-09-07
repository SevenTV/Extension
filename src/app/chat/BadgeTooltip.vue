<template>
	<div ref="tooltip" class="seventv-tooltip" tooltip-type="badge">
		<p>{{ alt }}</p>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	alt: string;
}>();
</script>

<style scoped lang="scss">
.seventv-tooltip {
	background-color: rgba(0, 0, 0, 0.65%);

	@at-root .seventv-transparent & {
		backdrop-filter: blur(0.25em);
	}

	border-radius: 0.33em;
	padding: 0.25em;
}
</style>
