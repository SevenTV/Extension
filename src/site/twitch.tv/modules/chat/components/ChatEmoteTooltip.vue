<template>
	<div class="seventv-tooltip" tooltip-type="emote" ref="tooltip">
		<h3>{{ emote.name }}</h3>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	emote: SevenTV.Emote;
}>();
</script>

<style scoped lang="scss">
.seventv-tooltip {
	background-color: black;
	padding: 1em;
}
</style>
