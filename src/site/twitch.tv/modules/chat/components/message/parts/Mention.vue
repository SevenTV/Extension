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
import { useFocusedChatters } from "@/composable/chat/useFocusedChatters";
import { useConfig } from "@/composable/useSettings";
import UserTag from "../UserTag.vue";

const props = defineProps<{
	token: MentionToken;
	msg: ChatMessage;
}>();

const clickToFocusOnChatterEnabled = useConfig<boolean>("chat.click_to_focus_on_chatter");
const shouldRenderColoredMentions = useConfig("chat.colored_mentions");
const ctx = useChannelContext();
const tools = useChatTools(ctx);
const focusedChatters = useFocusedChatters();

function onUsernameDoubleClick() {
	if (!focusedChatters) return;
	focusedChatters.value.push(props.token.content.recipient);
	// Clear blue selection after double clicking username
	document.getSelection()?.empty();
}

let clickTimer = -1;
function onClick(ev: MouseEvent) {
	if (clickToFocusOnChatterEnabled.value) {
		const target = ev.currentTarget;
		if (ev.detail === 1) {
			clickTimer = setTimeout(() => {
				// Single click
				tools.openViewerCard(ev, props.token.content.recipient, props.msg.id, target);
			}, 300);
		} else if (ev.detail >= 2) {
			// Double click
			clearTimeout(clickTimer);
			onUsernameDoubleClick();
		}
	} else {
		tools.openViewerCard(ev, props.token.content.recipient, props.msg.id);
	}
}
</script>

<style scoped lang="scss">
.mention-token {
	cursor: pointer;
	font-weight: bold;
}
</style>
