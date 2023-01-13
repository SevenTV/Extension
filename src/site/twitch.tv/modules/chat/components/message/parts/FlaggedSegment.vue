<template>
	<span v-if="!clicked" class="flagged-fragment" @click="clicked = true">
		{{ "*".repeat(part.length) }}
	</span>
	<span v-else>
		{{ part.originalText }}
	</span>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
	part: Twitch.ChatMessage.FlaggedSegmentPart;
}>();

const clicked = ref(false);
</script>
