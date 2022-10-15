<template>
	<div ref="tooltip" class="seventv-tooltip" tooltip-type="badge">
		<h3>{{ badge.title }}</h3>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	badge: Twitch.ChatBadge;
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
