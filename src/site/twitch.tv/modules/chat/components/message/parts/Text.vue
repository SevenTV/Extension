<template>
	<span :class="{ 'mention-part': part.type == MessagePartType.CURRENTUSERHIGHLIGHT }">
		{{ part.content }}
	</span>
</template>

<script setup lang="ts">
import { MessagePartType } from "@/site/twitch.tv";

defineProps<{
	part: Twitch.ChatMessage.Part;
}>();
</script>
