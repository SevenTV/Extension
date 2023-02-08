<template>
	<span class="seventv-welcome-message"> Welcome to the chat room! </span>
</template>

<script setup lang="ts">
defineProps<{
	msgData: Twitch.AnyMessage;
}>();
</script>

<style scoped lang="scss">
span.seventv-welcome-message {
	padding: 0.5rem 2rem;
	color: var(--seventv-muted);
}
</style>
