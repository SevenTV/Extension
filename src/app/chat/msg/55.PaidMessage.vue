<template>
	<div
		class="seventv-paid-message"
		:level="msgData.level"
		:class="{ 'seventv-paid-message-animated': animatedTier[msgData.level] }"
	>
		<div class="seventv-paid-message-heading">
			<UserTag
				v-if="msgData.message.user"
				:user="{
					id: msgData.message.user.userID,
					username: msgData.message.user.userLogin,
					displayName: msgData.message.user.displayName || msgData.message.user.userLogin,
					color: msgData.message.user.color,
				}"
				:badges="msgData.message.badges"
			/>
		</div>

		<div class="seventv-paid-message-content">
			<template v-if="msgData.message">
				<slot :hide-author="true" />
			</template>

			<div class="seventv-paid-message-payment">
				{{ msgData.currency }} {{ (msgData.amount / 100).toFixed(2) }}
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import UserTag from "../UserTag.vue";

defineProps<{
	msgData: Twitch.PaidMessage;
}>();

const animatedTier: Record<string, 1 | undefined> = {
	SIX: 1,
	SEVEN: 1,
	EIGHT: 1,
	NINE: 1,
	TEN: 1,
};
</script>

<style scoped lang="scss">
.seventv-paid-message {
	display: grid;
	grid-template-rows: 0.2fr 1.8fr;
	grid-template-areas:
		"heading"
		"content";
	margin: 1rem;
	border-radius: 0.25rem;

	&[level="ONE"] {
		background: rgb(107, 129, 110);
	}

	&[level="TWO"] {
		background: rgb(50, 132, 59);
	}

	&[level="THREE"] {
		background: rgb(0, 122, 108);
	}

	&[level="FOUR"] {
		background: rgb(0, 128, 169);
	}

	&[level="FIVE"] {
		background: rgb(103, 116, 128);
	}

	&[level="SIX"] {
		background-image: linear-gradient(90deg, #016dda, #0404ac, #016dda, #0404ac);
	}

	&[level="SEVEN"] {
		background-image: linear-gradient(90deg, #7614c7, #5060fc, #7614c7, #5060fc);
	}

	&[level="EIGHT"] {
		background-image: linear-gradient(90deg, #a001d4, #d211a3, #a001d4, #d211a3);
	}

	&[level="NINE"] {
		background-image: linear-gradient(90deg, #9004bd, #cb4227, #9004bd, #cb4227);
	}

	&[level="TEN"] {
		background-image: linear-gradient(90deg, #3919bc, #cf0110, #3919bc, #cf0110);
	}
}

.seventv-paid-message-heading {
	grid-area: heading;
	background: rgba(0, 0, 0, 20%);
	padding: 0.5rem;
}

.seventv-paid-message-content {
	grid-area: content;
	display: grid;
	grid-template-rows: 1fr 1fr;
	grid-template-areas:
		"message"
		"payment";
	padding: 0.75rem;
	row-gap: 1rem;
}

.seventv-paid-message-payment {
	font-size: 1.5rem;
	font-weight: 700;
}

.seventv-paid-message-animated {
	background-size: 400% 100%;
}
</style>
