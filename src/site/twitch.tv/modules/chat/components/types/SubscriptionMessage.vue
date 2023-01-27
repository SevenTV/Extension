<template>
	<span class="seventv-sub-message-container seventv-highlight">
		<div class="sub-part">
			<div class="sub-message-icon">
				<TwPrime v-if="plan == 'Prime'" />
				<TwStar v-else />
			</div>
			<div class="sub-message-text">
				<span v-if="msg.author" class="sub-name bold">
					{{ msg.author.displayName }}
				</span>
				<span class="bold">Subscribed</span>
				with
				{{ plan }}.
			</div>
		</div>

		<slot />
	</span>
</template>

<script setup lang="ts">
import { ChatMessage } from "@/common/chat/ChatMessage";
import TwPrime from "@/assets/svg/twitch/TwPrime.vue";
import TwStar from "@/assets/svg/twitch/TwStar.vue";

const props = defineProps<{
	msg: ChatMessage;
	msgData: Twitch.SubMessage;
}>();

const plan = props.msgData.methods?.plan == "Prime" ? "Prime" : "Tier " + props.msgData.methods?.plan.charAt(0);
</script>

<style scoped lang="scss">
.seventv-sub-message-container {
	display: block;
	padding: 0.5rem 2rem;
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
	overflow-wrap: anywhere;
	background-color: hsla(0deg, 0%, 50%, 10%);
}

.seventv-highlight {
	border-left: 0.4rem solid var(--seventv-primary-color);
	padding-left: 1.6rem !important;
}

.sub-part {
	display: flex;
	.sub-message-text {
		margin-left: 0.25rem;
		.bold {
			font-weight: 700;
		}
		.sub-name {
			display: block;
			color: var(--color-text-link);
		}
	}
}

.message-part {
	margin-top: 0.5rem;
}
</style>
