<template>
	<span :class="{ 'mention-part': part.content.currentUserMentionRelation === 1 }">
		{{ "@" + part.content.recipient }}
	</span>
</template>

<script setup lang="ts">
defineProps<{
	part: Twitch.ChatMessage.MentionPart;
}>();
</script>
