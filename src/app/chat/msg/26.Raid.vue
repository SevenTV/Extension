<template>
	<span class="seventv-raid-message-container seventv-highlight">
		<span class="bold">{{ msgData.params.displayName }}</span>
		raided with a viewer count of
		<span class="bold"> {{ msgData.params.viewerCount }}</span>
		<span>.</span>
	</span>
</template>

<script setup lang="ts">
defineProps<{
	msgData: Twitch.RaidMessage;
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

	.bold {
		font-weight: 700;
	}
}

.seventv-highlight {
	border-left: 0.4rem solid var(--seventv-channel-accent);
	padding-left: 1.6rem !important;
}
</style>
