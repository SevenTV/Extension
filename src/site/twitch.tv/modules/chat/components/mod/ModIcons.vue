<template>
	<span class="seventv-chat-mod-buttons">
		<span
			v-if="msg.author && !msg.author.isActor"
			ref="banRef"
			@click="banUserFromChat(null)"
			@mouseenter="banTooltip.show(banRef)"
			@mouseleave="banTooltip.hide()"
		>
			<TwChatModBan />
		</span>

		<span
			v-if="msg.author && !msg.author.isActor"
			ref="timeoutRef"
			@click="banUserFromChat('10m')"
			@mouseenter="timeoutTooltip.show(timeoutRef)"
			@mouseleave="timeoutTooltip.hide()"
		>
			<TwChatModTimeout />
		</span>

		<span
			v-if="msg.author && !msg.author.isActor"
			ref="warnRef"
			@click="showWarnPopover()"
			@mouseenter="warnTooltip.show(warnRef)"
			@mouseleave="warnTooltip.hide()"
		>
			<TwChatModWarn />
		</span>

		<span
			ref="deleteRef"
			@click="deleteChatMessage(msg.id)"
			@mouseenter="deleteTooltip.show(deleteRef)"
			@mouseleave="deleteTooltip.hide()"
		>
			<TwChatModDelete />
		</span>
	</span>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { ChatMessage } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatModeration } from "@/composable/chat/useChatModeration";
import { useChatTools } from "@/composable/chat/useChatTools";
import { useTooltip } from "@/composable/useTooltip";
import TwChatModBan from "@/assets/svg/twitch/TwChatModBan.vue";
import TwChatModDelete from "@/assets/svg/twitch/TwChatModDelete.vue";
import TwChatModTimeout from "@/assets/svg/twitch/TwChatModTimeout.vue";
import TwChatModWarn from "@/assets/svg/twitch/TwChatModWarn.vue";

const props = defineProps<{
	msg: ChatMessage;
}>();

const ctx = useChannelContext();
const tools = useChatTools(ctx);
const { banUserFromChat, deleteChatMessage } = useChatModeration(ctx, props.msg.author?.username ?? "");

function showWarnPopover() {
	if (!props.msg.author) return;
	tools.openViewerWarnPopover(props.msg.author.id, props.msg.author.username, 0);
}

const banRef = ref();
const banTooltip = useTooltip(`Ban ${props.msg.author?.username ?? "???"}`);

const timeoutRef = ref();
const timeoutTooltip = useTooltip(`Timeout ${props.msg.author?.username ?? "???"}`);

const warnRef = ref();
const warnTooltip = useTooltip(`Warn ${props.msg.author?.username ?? "???"}`);

const deleteRef = ref();
const deleteTooltip = useTooltip(`Delete message by ${props.msg.author?.username ?? "???"}`);
</script>

<style scoped lang="scss">
.seventv-chat-mod-buttons {
	display: inline-block;
	color: hsl(0deg, 0%, 65%);
	margin-right: 0.35em;
	font-size: 1.25em;

	span,
	svg {
		cursor: pointer;
		vertical-align: middle;

		&:hover {
			color: hsl(0deg, 0%, 70%);
		}
	}
}
</style>
