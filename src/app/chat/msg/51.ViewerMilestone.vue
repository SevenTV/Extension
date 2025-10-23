<template>
	<span class="seventv-viewer-milestone-container seventv-highlight">
		<div class="milestone-part">
			<div class="milestone-icon">
				<TwFlame />
			</div>
			<div class="milestone-text">
				<div class="milestone-header">
					<span v-if="msg.author" class="viewer-name bold">{{ msg.author.displayName }}</span>
					<span class="milestone-points">
						+
						<TwChannelPoints />
						{{ msgData.copoReward }}
					</span>
				</div>
				<span class="bold">Watch Streak Reached!: </span>
				<span v-if="msg.author">{{ msg.author.displayName }}</span>
				is currently on a {{ msgData.watchStreak }}-stream streak
				<template v-if="msgData.sourceData">
					<span>in {{ msgData.sourceData.displayName }}'s channel</span>
				</template>
				<span>!</span>
			</div>
		</div>

		<div v-if="msg.body" class="message-part">
			<slot />
		</div>
	</span>
</template>

<script setup lang="ts">
import type { ChatMessage } from "@/common/chat/ChatMessage";
import TwChannelPoints from "@/assets/svg/twitch/TwChannelPoints.vue";
import TwFlame from "@/assets/svg/twitch/TwFlame.vue";

defineProps<{
	msg: ChatMessage;
	msgData: Twitch.MilestoneMessage;
}>();
</script>

<style scoped lang="scss">
.seventv-viewer-milestone-container {
	display: block;
	padding: 0.5rem 2rem;
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
	overflow-wrap: anywhere;

	.milestone-part {
		display: flex;

		.milestone-text {
			margin-left: 0.25rem;

			.milestone-header {
				display: flex;
			}

			.milestone-points {
				display: flex;
				align-items: center;
				margin-left: 0.5rem;
				color: var(--color-text-alt-2);
			}

			.bold {
				font-weight: 700;
			}

			.viewer-name {
				display: block;
				color: var(--color-text-link);
			}
		}
	}
}

.seventv-highlight {
	border-left: 0.4rem solid var(--color-border-quote);
	padding-left: 1.6rem !important;
}

.message-part {
	margin-top: 0.5rem;
}
</style>
