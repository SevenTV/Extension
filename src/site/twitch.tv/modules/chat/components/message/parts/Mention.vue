<template>
	<span class="mention-part">
		{{ token.content.displayText }}
	</span>
</template>

<script setup lang="ts">
import { MentionToken } from "@/common/chat/ChatMessage";

defineProps<{
	token: MentionToken;
}>();
</script>
