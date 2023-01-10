<template>
	<div ref="tooltip" class="seventv-tooltip" tooltip-type="emote">
		<h3>{{ emote.name }}</h3>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	emote: SevenTV.Emote;
}>();
</script>

<style scoped lang="scss">
.seventv-tooltip {
	background-color: rgba(0, 0, 0, 0.65%);
	backdrop-filter: blur(0.25em);
	border-radius: 0.33em;
	padding: 1em;
}
</style>
