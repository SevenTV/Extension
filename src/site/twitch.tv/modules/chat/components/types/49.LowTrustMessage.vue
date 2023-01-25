<template>
	<div class="seventv-restricted-low-trust-user-message-container">
		<UserMessage
			v-if="msg.message"
			:msg="msg.message"
			:highlight="{ label: 'Restricted Suspicious User', color: '#ff7d00' }"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useConfig } from "@/composable/useSettings";
import UserMessage from "../message/UserMessage.vue";

defineProps<{
	msg: Twitch.RestrictedLowTrustUserMessage;
}>();

const paddingStyle = useConfig<number>("chat.padding");
const sidePadding = computed(
	() =>
		({
			0: "0",
			1: "1rem",
		}[paddingStyle.value]),
);
</script>

<style scoped lang="scss">
.seventv-restricted-low-trust-user-message-container {
	display: block;
	position: relative;
	overflow-wrap: anywhere;
	padding: 0 v-bind(sidePadding);
}
</style>
