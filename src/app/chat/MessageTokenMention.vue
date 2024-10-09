<template>
	<span class="mention-token">
		<UserTag
			:user="
				token.content.user ?? {
					id: uuid(),
					username: tag.toLowerCase(),
					displayName: tag,
					color: '',
				}
			"
			is-mention
			:hide-at="!hasAt"
			hide-badges
		/>
	</span>
</template>

<script setup lang="ts">
import type { ChatMessage, MentionToken } from "@/common/chat/ChatMessage";
import UserTag from "./UserTag.vue";
import { v4 as uuid } from "uuid";

const props = defineProps<{
	token: MentionToken;
	msg?: ChatMessage;
}>();

const hasAt = props.token.content.displayText.charAt(0) === "@";
const tag = hasAt ? props.token.content.displayText.slice(1) : props.token.content.displayText;
</script>

<style scoped lang="scss">
.mention-token {
	cursor: pointer;
	font-weight: bold;
}
</style>
