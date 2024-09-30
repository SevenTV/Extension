<template>
	<span class="seventv-sub-message-container seventv-highlight">
		<div class="sub-part">
			<div class="gift-icon">
				<TwMassGift />
			</div>
			<div class="sub-message-text">
				<span class="sub-name-big">
					{{ msgData.user.displayName }}
				</span>
				is gifting {{ msgData.massGiftCount }} Tier {{ msgData.plan.charAt(0) }} Sub{{
					msgData.massGiftCount > 1 ? "s" : ""
				}}
				<template v-if="msgData.sourceData">
					<span>to {{ msgData.sourceData.displayName }}'s community</span>
				</template>
				<span>.</span>
				<template v-if="msgData.senderCount == msgData.massGiftCount">
					It's their first Gift Sub in the channel!
				</template>
				<template v-else> They've gifted a total of {{ msgData.senderCount }} Subs in the channel! </template>
			</div>
		</div>
	</span>
</template>

<script setup lang="ts">
import TwMassGift from "@/assets/svg/twitch/TwMassGift.vue";

defineProps<{
	msgData: Twitch.MassGiftMessage;
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
	border-left: 0.4rem solid var(--seventv-channel-accent);
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
