<template>
	<span class="seventv-reward-message-container seventv-highlight">
		<div v-if="msgData.reward" class="reward-part">
			<div class="reward-left">
				<span class="reward-username bold">
					{{ msgData.displayName }}
				</span>
				redeemed
				<div class="reward-name bold">
					{{ msgData.reward.name }}
				</div>
			</div>
			<span class="reward-cost bold">
				{{ msgData.reward.cost }}
			</span>
		</div>

		<!-- Message part -->
		<div v-if="msgData.message" class="message-part" :highlight="msgData.reward.isHighlighted">
			<slot />
		</div>
	</span>
</template>

<script setup lang="ts">
defineProps<{
	msgData: Twitch.ChannelPointsRewardMessage;
}>();
</script>

<style scoped lang="scss">
.seventv-reward-message-container {
	display: block;
	padding: 0.5rem 2rem;
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
	overflow-wrap: anywhere;
	background-color: hsla(0deg, 0%, 50%, 5%);

	.reward-part {
		display: flex;
		justify-content: space-between;

		.bold {
			font-weight: 700;
		}

		.reward-left {
			display: inline-block;
		}
		.reward-cost {
			margin-left: 1rem;
			flex-grow: 0;
			flex-shrink: 0;
		}
	}

	.message-part {
		margin-top: 0.5rem;

		&[highlight="true"] {
			background-color: #755ebc;
			border-radius: 0.2rem;
			padding: 0.5rem;
			margin-left: -0.5rem;
			margin-right: -0.5rem;
		}
	}
}

.seventv-highlight {
	border-left: 0.4rem solid grey;
	padding-left: 1.6rem !important;
}
</style>
