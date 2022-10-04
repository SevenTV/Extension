<template>
	<span :id="msg.id" class="seventv-unhandled-message-ref"></span>
</template>

<script setup lang="ts">
defineProps<{
	msg: Twitch.ChatMessage;
}>();
</script>
