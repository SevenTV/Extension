<template>
	<span class="seventv-sub-message-container seventv-highlight">
		<div class="sub-part">
			<div class="gift-icon">
				<TwMassGift />
			</div>
			<div class="sub-message-text">
				<span class="sub-name-big">
					{{ msg.user.displayName }}
				</span>
				is gifting {{ msg.massGiftCount }} Tier {{ msg.plan.charAt(0) }} Sub{{
					msg.massGiftCount > 1 ? "s" : ""
				}}
				to {{ msg.channel }}'s community.
				<template v-if="msg.senderCount == msg.massGiftCount">
					It's their first Gift Sub in the channel!
				</template>
				<template v-else> They've gifted a total of {{ msg.senderCount }} Subs in the channel! </template>
			</div>
		</div>
	</span>
</template>

<script setup lang="ts">
import TwMassGift from "@/assets/svg/twitch/TwMassGift.vue";

defineProps<{
	msg: Twitch.MassGiftMessage;
}>();
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
	.gift-icon {
		display: flex;
		flex-shrink: 0;
		padding-right: 1.6rem;
		margin: auto 0;
	}
	.sub-message-text {
		margin-left: 0.25rem;
		.bold {
			font-weight: 700;
		}
		.sub-name-big {
			display: block;
			font-size: larger;
			font-weight: 700;
		}
	}
}
</style>
