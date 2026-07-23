<template>
	<img
		class="seventv-chat-gif"
		:src="token.content.url"
		:alt="token.content.title || 'GIF'"
		decoding="async"
		draggable="false"
	/>
</template>

<script setup lang="ts">
import type { GifToken } from "@/common/chat/ChatMessage";

defineProps<{
	token: GifToken;
}>();
</script>

<style scoped lang="scss">
.seventv-chat-gif {
	display: block;
	max-width: 100%;
	max-height: 24rem;
	margin-top: 0.4rem;
	border-radius: 0.4rem;
	object-fit: contain;
}
</style>
