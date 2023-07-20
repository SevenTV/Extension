<template>
	<span class="seventv-reward-message-container seventv-highlight">
		<div v-if="msgData.reward" class="reward-part">
			<div class="reward-left">
				<span class="reward-username bold">
					{{ msgData.displayName }}
				</span>
				redeemed
				<span class="reward-name bold">
					{{ msgData.reward.name }}
				</span>
			</div>
			<span class="reward-cost bold">
				<TwChannelPoints />
				<span>{{ msgData.reward.cost }}</span>
			</span>
		</div>

		<!-- Message part -->
		<div v-if="msgData.message" class="message-part" :highlight="msgData.reward.isHighlighted">
			<slot />
		</div>
	</span>
</template>

<script setup lang="ts">
import type { ChatMessage } from "@/common/chat/ChatMessage";
import TwChannelPoints from "@/assets/svg/twitch/TwChannelPoints.vue";

defineProps<{
	msg: ChatMessage;
	msgData: Twitch.ChannelPointsRewardMessage;
}>();
</script>

<style scoped lang="scss">
.seventv-reward-message-container {
	display: block;
	padding: 0.5rem 2rem;
	overflow-wrap: anywhere;
	background-color: hsla(0deg, 0%, 50%, 5%);

	.reward-part {
		display: grid;
		grid-template-columns: 1fr auto;

		.bold {
			font-weight: 700;
		}

		.reward-left {
			display: inline-block;
			color: var(--seventv-muted);
		}

		.reward-cost {
			color: var(--seventv-muted);
			margin-left: 1rem;

			span,
			svg {
				display: inline-block;
				vertical-align: middle;
				margin: 0 0.15rem;
			}
		}
	}

	.message-part {
		margin-top: 0.5rem;

		&[highlight="true"] {
			border-radius: 0.2rem;
			padding: 0.25rem;
			margin-left: -0.5rem;
			margin-right: -0.5rem;
		}
	}
}

.seventv-highlight {
	border-left: 0.35rem solid;
	border-right: 0.35rem solid;
	border-color: var(--seventv-channel-accent);
	padding-left: 1.6rem !important;
}
</style>
