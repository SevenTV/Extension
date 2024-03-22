<template>
	<span class="seventv-bits-badge-message-container seventv-highlight">
		<div class="bits-badge-header">
			<div class="bits-icon">
				<TwBits />
			</div>
			<div class="bits-text">
				<span class="bits-username bold">
					{{ msgData.user.displayName }}
				</span>
				just earned a new
				<span class="bold">{{ msgData.threshold }} Bits badge!</span>
			</div>
		</div>
		<div v-if="msg.body" class="bits-badge-message">
			<slot />
		</div>
	</span>
</template>

<script setup lang="ts">
import { ChatMessage } from "@/common/chat/ChatMessage";
import TwBits from "@/assets/svg/twitch/TwBits.vue";

defineProps<{
	msg: ChatMessage;
	msgData: Twitch.BitsBadgeTierMessage;
}>();
</script>

<style scoped lang="scss">
.seventv-bits-badge-message-container {
	display: block;
	border-image-slice: 1;
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
	overflow-wrap: anywhere;
	background-color: hsla(0deg, 0%, 50%, 5%);

	.bits-badge-header {
		padding: 0.5rem 0.5rem 0.5rem 1rem;
		display: flex;
		align-items: center;

		.bits-icon {
			display: inline-flex;
			padding: 0 0.5rem;
			color: var(--color-fill-alt-2);
		}

		.bits-text {
			.bold {
				font-weight: 700;
			}
		}
	}

	.bits-badge-message {
		padding: 0.5rem 1.2rem;
	}
}

.seventv-highlight {
	border-left: 0.4rem solid var(--seventv-channel-accent);
}
</style>
