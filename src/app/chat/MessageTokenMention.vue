<template>
	<span class="mention-token">
		<UserTag
			:user="
				shouldRenderColoredMentions && token.content.user ? token.content.user : {
					id: uuid(),
					username: tag.toLowerCase(),
					displayName: tag,
					color: '',
				}
			"
			:as-mention="asMention"
			:hide-badges="true"
			:style="shouldRenderColoredMentions ? { color: token.content.user?.color } : null"
		/>
	</span>
</template>

<script setup lang="ts">
import type { ChatMessage, MentionToken } from "@/common/chat/ChatMessage";
import { useConfig } from "@/composable/useSettings";
import UserTag from "./UserTag.vue";
import { v4 as uuid } from "uuid";

const props = defineProps<{
	token: MentionToken;
	msg?: ChatMessage;
}>();

const shouldRenderColoredMentions = useConfig<boolean>("chat.colored_mentions");

const asMention = props.token.content.displayText.charAt(0) === "@";
const tag = asMention ? props.token.content.displayText.slice(1) : props.token.content.displayText;
</script>

<style scoped lang="scss">
.mention-token {
	cursor: pointer;
	font-weight: bold;
}
</style>
