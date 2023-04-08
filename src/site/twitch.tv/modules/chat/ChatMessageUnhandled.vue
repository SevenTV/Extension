<template>
	<span :id="msg.id" ref="msgContainer" class="seventv-unhandled-message-ref" />
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { ChatMessage } from "@/common/chat/ChatMessage";

const props = defineProps<{
	msg: ChatMessage;
}>();

const msgContainer = ref<HTMLSpanElement | null>(null);

onMounted(() => {
	if (!msgContainer.value || !props.msg.wrappedNode) return;

	msgContainer.value.appendChild(props.msg.wrappedNode);
});
</script>
