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
	background-color: black;
	padding: 1em;
}
</style>
