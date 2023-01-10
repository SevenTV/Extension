<template>
	<span class="seventv-chat-message-container">
		<UserMessage :msg="msg" />
	</span>
</template>

<script setup lang="ts">
import UserMessage from "../message/UserMessage.vue";

defineProps<{
	msg: Twitch.ChatMessage;
}>();
</script>

<style scoped lang="scss">
.seventv-chat-message-container {
	display: block;
	padding: 0.5rem 2rem;
	overflow-wrap: anywhere;
}
</style>
