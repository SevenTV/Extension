<template>
	<span class="mention-token">
		<span v-if="shouldRenderColoredMentions" :style="{ color: token.content.user?.color }">
			<UserTag
				:user="
					token.content.user ?? {
						id: uuid(),
						username: tag.toLowerCase(),
						displayName: tag,
						color: '',
					}
				"
				:as-mention="asMention"
				:hide-badges="true"
			/>
		</span>
		<span v-else>
			{{ token.content.displayText }}
		</span>
	</span>
</template>

<script setup lang="ts">
import type { ChatMessage, MentionToken } from "@/common/chat/ChatMessage";
import { useConfig } from "@/composable/useSettings";
import UserTag from "@/site/twitch.tv/modules/chat/components/user/UserTag.vue";
import { v4 as uuid } from "uuid";

const props = defineProps<{
	token: MentionToken;
	msg?: ChatMessage;
}>();

const shouldRenderColoredMentions = useConfig("chat.colored_mentions");

const asMention = props.token.content.displayText.charAt(0) === "@";
const tag = asMention ? props.token.content.displayText.slice(1) : props.token.content.displayText;
</script>

<style scoped lang="scss">
.mention-token {
	cursor: pointer;
	font-weight: bold;
}
</style>
