<template>
	<a :href="part.content.url" target="_blank" class="link-part">
		{{ part.content.displayText }}
	</a>
</template>

<script setup lang="ts">
defineProps<{
	part: Twitch.ChatMessage.LinkPart;
}>();
</script>
