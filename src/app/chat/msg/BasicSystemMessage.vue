<template>
	<span class="seventv-basic-system-message"> {{ text }} </span>
</template>

<script setup lang="ts">
defineProps<{
	text: string;
}>();
</script>

<style scoped lang="scss">
span.seventv-basic-system-message {
	display: block;
	padding: 0.5rem 2rem;
	color: var(--seventv-muted);
}
</style>
