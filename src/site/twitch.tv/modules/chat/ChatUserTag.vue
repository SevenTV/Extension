<template>
	<span v-if="user && user.userDisplayName" class="seventv-chat-user" :style="{ color: user.color }">
		<span class="seventv-chat-user-username">
			<span>{{ user.userDisplayName }}</span>
			<span v-if="user.isIntl"> ({{ user.userLogin }})</span>
		</span>
	</span>
</template>

<script setup lang="ts">
defineProps<{
	user: Twitch.ChatUser;
}>();
</script>

<style scoped lang="scss">
.seventv-chat-user {
	display: inline-block !important;
	cursor: pointer;
	word-break: break-all;
}

.seventv-chat-user-username {
	font-weight: 700;

	&:hover {
		text-decoration: underline;
	}
}
</style>
