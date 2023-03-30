<template>
	<div class="seventv-tray-header">
		<div class="seventv-tray-icon seventv-reply">
			<TwReply v-if="thread.length <= 1" />
			<TwChatReply v-else />
		</div>
		<div class="seventv-tray-header-text">
			<span v-if="thread.length <= 1 && authorID">
				{{ `Replying to @${displayName ?? username}:` }}
			</span>
			<span v-else> Thread </span>
		</div>
		<div class="seventv-tray-icon seventv-close" @click="close()">
			<TwClose />
		</div>
	</div>
	<div class="seventv-tray-user-message-container">
		<UserMessage
			v-for="m of thread"
			:key="m.id"
			:msg="m"
			:emotes="emotes.active"
			:as="'Reply'"
			class="thread-msg"
			:class="{ 'is-root-msg': currentMsg?.id === m.id }"
		/>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ChatMessage } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import UserMessage from "@/site/twitch.tv/modules/chat/components/message/UserMessage.vue";
import TwChatReply from "@/assets/svg/twitch/TwChatReply.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import TwReply from "@/assets/svg/twitch/TwReply.vue";

const props = defineProps<{
	close: () => void;
	id: string;
	authorID?: string;
	username?: string;
	displayName?: string;
	body: string;
	deleted: boolean;
}>();

const currentMsg = ref<ChatMessage | null>(null);
const thread = ref<ChatMessage[]>([]);

const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);
const { find } = useChatMessages(ctx);
onMounted(() => {
	currentMsg.value = find((m) => m.id === props.id);
	if (!currentMsg.value) return;

	const replies = find((m) => {
		return !!(m.parent && m.parent.id === currentMsg.value!.id);
	}, true);

	thread.value = [...replies, currentMsg.value];
});
</script>

<style scoped lang="scss">
.seventv-tray-header {
	display: flex;
	justify-content: space-between;

	.seventv-tray-icon {
		font-size: 1.25em;
		fill: currentColor;
		padding: 0.5rem;
		flex-shrink: 0;

		svg {
			display: flex;
			align-self: center;
		}
	}

	.seventv-tray-header-text {
		color: var(--color-text-alt);
		display: flex;
		font-size: 1.4rem;
		font-weight: 600;
		margin: 0 0.5rem;
		flex-grow: 1;
		vertical-align: middle;
		align-items: center;
	}
	.seventv-close {
		float: right;
		cursor: pointer;
		&:hover {
			background-color: hsla(0deg, 0%, 60%, 24%);
			border-radius: 0.4rem;
		}
	}
}

.seventv-tray-user-message-container {
	display: flex;
	flex-direction: column-reverse;
	padding: 0.5rem 1rem;

	.thread-msg {
		padding-left: 1em;
		padding-bottom: 0.5em;
		border-left: 0.25em solid grey;
	}
	.is-root-msg {
		margin-bottom: 0.5em;
		padding-left: 0;
		border-left: none;
	}
}
</style>
