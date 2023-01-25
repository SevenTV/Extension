<template>
	<span class="seventv-raid-message-container">
		{{ msg.params.displayName }} raided with a viewer count of {{ msg.params.viewerCount }}.
	</span>
</template>

<script setup lang="ts">
defineProps<{
	msg: Twitch.RaidMessage;
}>();
</script>

<style scoped lang="scss">
.seventv-raid-message-container {
	display: block;
	padding: 0.5rem 2rem;
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
	overflow-wrap: anywhere;
	background-color: hsla(0deg, 0%, 50%, 5%);
}
</style>
