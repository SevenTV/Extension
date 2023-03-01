<template>
	<span class="seventv-sub-message-container seventv-highlight">
		<div class="sub-part">
			<div class="sub-message-icon">
				<TwPrime v-if="msgData.methods?.plan == 'Prime'" />
				<TwStar v-else />
			</div>
			<div class="sub-message-text">
				<span v-if="msgData.user" class="sub-name bold">
					{{ msgData.user.displayName }}
				</span>
				<span class="bold">Subscribed</span>
				with
				{{ plan }}. They've subscribed for
				<span class="bold"> {{ msgData.cumulativeMonths }} months</span>
				<template v-if="msgData.shouldShareStreakTenure">
					, {{ msgData.streakMonths }} month{{ (msgData.streakMonths ?? 0) > 1 ? "s" : "" }} in a row.
				</template>
				<template v-else>! </template>
			</div>
		</div>

		<!-- Message part -->
		<div v-if="msgData.message" class="message-part">
			<slot />
		</div>
	</span>
</template>

<script setup lang="ts">
import TwPrime from "@/assets/svg/twitch/TwPrime.vue";
import TwStar from "@/assets/svg/twitch/TwStar.vue";

const props = defineProps<{
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
