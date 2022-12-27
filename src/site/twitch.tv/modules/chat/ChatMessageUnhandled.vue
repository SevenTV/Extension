<template>
	<span :id="msg.id" ref="msgContainer" class="seventv-unhandled-message-ref"></span>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const props = defineProps<{
	msg: Twitch.ChatMessage;
}>();

const msgContainer = ref<HTMLSpanElement | null>(null);

onMounted(() => {
	if (!msgContainer.value || !props.msg.element) return;

	msgContainer.value.appendChild(props.msg.element);
});
</script>
