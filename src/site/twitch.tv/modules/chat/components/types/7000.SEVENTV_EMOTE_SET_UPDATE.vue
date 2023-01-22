<template>
	<span class="seventv-emote-set-update-message-container">
		<span class="seventv-logo">
			<Logo provider="7TV" />
		</span>

		<span v-if="msg.app_user" class="seventv-author">
			{{ msg.app_user.display_name }}
		</span>

		<span class="seventv-change-detail">
			<!-- Add -->
			<template v-if="msg.add.length > 1">
				<span>added {{ msg.add.length }} emotes </span>
			</template>
			<template v-else-if="msg.add.length">
				<span>added the emote </span>
			</template>

			<template v-for="ae of msg.add" :key="ae.id">
				<span class="referenced-emote">
					<Emote :emote="ae" />
					{{ ae.name }}
				</span>
			</template>

			<!-- Remove -->
			<template v-if="msg.add.length && msg.remove.length">
				<span> and </span>
			</template>
			<template v-if="msg.remove.length > 1">
				<span>removed {{ msg.remove.length }} emotes </span>
			</template>
			<template v-else-if="msg.remove.length">
				<span>removed the emote </span>
			</template>

			<template v-for="ae of msg.remove" :key="ae.id">
				<span class="referenced-emote">
					<Emote :emote="ae" />
					<span>{{ ae.name }}</span>
				</span>
			</template>
		</span>
	</span>
</template>

<script setup lang="ts">
import Logo from "@/assets/svg/logos/Logo.vue";
import Emote from "../message/Emote.vue";

defineProps<{
	msg: Twitch.SeventvEmoteSetUpdateMessage;
}>();
</script>

<style scoped lang="scss">
.seventv-emote-set-update-message-container {
	display: inline-block;
	font-size: 1.25rem;
	margin-left: 1rem;
	padding: 0.25em 0;

	.seventv-logo {
		vertical-align: middle;
		font-size: 2.5rem;
		color: var(--seventv-primary);
		margin-right: 0.25em;
	}

	.seventv-author {
		font-weight: 700;
		margin-right: 0.25em;
	}

	.seventv-change-detail {
		.referenced-emote {
			display: inline-grid;
			gap: 0.5em;
			align-items: center;
			vertical-align: middle;
			font-weight: 700;
			grid-template-columns: 3rem auto;
			margin-right: 0.5em;
		}
	}
}
</style>
