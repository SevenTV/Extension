<template>
	<a :href="token.content.url" target="_blank" class="link-part">
		{{ token.content.displayText }}
	</a>
</template>

<script setup lang="ts">
import { ChatMessage, LinkToken } from "@/common/chat/ChatMessage";

defineProps<{
	token: LinkToken;
	msg: ChatMessage;
}>();
</script>
