<template>
	<span class="seventv-sub-message-container seventv-highlight">
		<div class="sub-part">
			<div class="sub-message-icon">
				<TwPrime v-if="msg.methods?.plan == 'Prime'" />
				<TwStar v-else />
			</div>
			<div class="sub-message-text">
				<span class="sub-name bold">
					{{ msg.user.displayName }}
				</span>
				<span class="bold">Subscribed</span>
				with
				{{ plan }}.
			</div>
		</div>

		<!-- Message part -->
		<div v-if="msg.message" class="message-part">
			<UserMessage :msg="msg.message" />
		</div>
	</span>
</template>

<script setup lang="ts">
import TwPrime from "@/assets/svg/twitch/TwPrime.vue";
import TwStar from "@/assets/svg/twitch/TwStar.vue";
import UserMessage from "../message/UserMessage.vue";

const props = defineProps<{
	msg: Twitch.SubMessage;
}>();

const plan = props.msg.methods?.plan == "Prime" ? "Prime" : "Tier " + props.msg.methods?.plan.charAt(0);
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
