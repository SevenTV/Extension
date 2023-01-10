<template>
	<div class="seventv-announce-message-container" :class="'announcement-line--' + msg.color.toLowerCase()">
		<div class="announce-header">
			<div class="announce-icon">
				<TwAnnounce />
			</div>
			<div class="announce-title">Announcement</div>
		</div>
		<div class="announce-message">
			<UserMessage :msg="msg.message" />
		</div>
	</div>
</template>

<script setup lang="ts">
import TwAnnounce from "@/assets/svg/twitch/TwAnnounce.vue";
import UserMessage from "../message/UserMessage.vue";

defineProps<{
	msg: Twitch.AnnouncementMessage;
}>();
</script>

<style scoped lang="scss">
.seventv-announce-message-container {
	display: block;
	border-image-slice: 1;
	border-left: 0.8rem solid;
	border-right: 0.8rem solid;
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
	overflow-wrap: anywhere;
	background-color: hsla(0deg, 0%, 50%, 5%);

	.announce-header {
		background-color: hsla(0deg, 0%, 50%, 15%);
		padding: 0.5rem 0.5rem 0.5rem 1rem;
		display: flex;

		.announce-icon {
			display: inline-flex;
			padding: 0 0.5rem;
		}
		.announce-title {
			font-weight: 600;
		}
	}

	.announce-message {
		padding: 0.5rem 2rem;
	}
}

.announcement-line--primary {
	border-color: var(--seventv-primary-color, currentColor);
}
</style>
