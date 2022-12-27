<template>
	<div v-for="msg of messages" :key="msg.id" :msg-id="msg.id">
		<template v-if="msg.seventv">
			<ChatMessage :msg="msg" :controller="controller" />
		</template>
		<template v-else>
			<ChatMessageUnhandled :msg="msg" />
		</template>
	</div>
</template>

<script setup lang="ts">
import ChatMessage from "@/site/twitch.tv/modules/chat/components/ChatMessage.vue";
import ChatMessageUnhandled from "./ChatMessageUnhandled.vue";

defineProps<{
	controller: Twitch.ChatControllerComponent | undefined;
	messages: Twitch.ChatMessage[];
}>();
</script>
