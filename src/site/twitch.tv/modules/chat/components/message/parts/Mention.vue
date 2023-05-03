<template>
	<span class="mention-token" @click="onClick">
		<span v-if="shouldRenderColoredMentions && token.content.user" :style="{ color: token.content.user.color }">
			<UserTag
				:user="token.content.user"
				:as-mention="token.content.displayText.charAt(0) === '@'"
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
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatTools } from "@/composable/chat/useChatTools";
import { useConfig } from "@/composable/useSettings";
import UserTag from "@/site/twitch.tv/modules/chat/components/user/UserTag.vue";

const props = defineProps<{
	token: MentionToken;
	msg?: ChatMessage;
}>();

const shouldRenderColoredMentions = useConfig("chat.colored_mentions");
const ctx = useChannelContext();
const tools = useChatTools(ctx);

function onClick(ev: MouseEvent) {
	if (!props.msg) return;

	tools.openViewerCard(ev, props.token.content.recipient, props.msg.id);
}
</script>

<style scoped lang="scss">
.mention-token {
	cursor: pointer;
	font-weight: bold;
}
</style>
