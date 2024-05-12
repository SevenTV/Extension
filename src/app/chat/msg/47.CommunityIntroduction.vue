<template>
	<span class="seventv-introduction-message-container seventv-highlight">
		<div class="introduction-header">
			<div class="introduction-icon">
				<TwGreet />
			</div>
			New Introduction
		</div>
		<div class="introduction-message">
			<slot />
		</div>
	</span>
</template>

<script setup lang="ts">
import TwGreet from "@/assets/svg/twitch/TwGreet.vue";

defineProps<{
	msgData: Twitch.CommunityIntroductionMessage;
}>();
</script>

<style scoped lang="scss">
.seventv-introduction-message-container {
	display: block;
	border-image-slice: 1;
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
	overflow-wrap: anywhere;
	background-color: hsla(0deg, 0%, 50%, 5%);

	.introduction-header {
		padding: 0.5rem 0.5rem 0.5rem 1rem;
		display: flex;

		.introduction-icon {
			display: inline-flex;
			padding: 0 0.5rem;
		}
	}

	.introduction-message {
		padding: 0.5rem 1.2rem;
	}
}

.seventv-highlight {
	border-left: 0.4rem solid #ff75e6;
}
</style>
