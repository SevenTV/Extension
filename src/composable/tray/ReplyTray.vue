<template>
	<div class="seventv-tray-header">
		<div class="seventv-tray-icon seventv-reply">
			<TwReply v-if="thread.length <= 1" />
			<TwChatReply v-else />
		</div>
		<div class="seventv-tray-header-text">
			<span v-if="thread.length <= 1">
				{{ `Replying to @${msg.user.userDisplayName}:` }}
			</span>
			<span v-else> Thread </span>
		</div>
		<div class="seventv-tray-icon seventv-close" @click="close()">
			<TwClose />
		</div>
	</div>
	<div class="seventv-tray-user-message-container">
		<template v-for="(m, index) of thread" :key="index">
			<UserMessage :msg="m" :as="'Reply'" class="thread-msg" :class="{ 'is-root-msg': rootMsgID === m.id }" />
		</template>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { MessageType } from "@/site/twitch.tv";
import UserMessage from "@/site/twitch.tv/modules/chat/components/message/UserMessage.vue";
import TwChatReply from "@/assets/svg/twitch/TwChatReply.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import TwReply from "@/assets/svg/twitch/TwReply.vue";
import { useChatMessages } from "../chat/useChatMessages";

const props = defineProps<{
	close: () => void;
	msg: Twitch.ChatMessage;
}>();

const rootMsgID = ref("");
const thread = ref<Twitch.ChatMessage[]>([props.msg]);

const { find } = useChatMessages();
onMounted(() => {
	let currentMsg: Twitch.ChatMessage | undefined = props.msg;
	for (;;) {
		if (!currentMsg) break;

		const parentID = currentMsg.reply?.parentMsgId as string | undefined;
		if (!parentID) break;

		const parentMsg = find((m) => m.id === parentID);
		if (!parentMsg || !isChatMessage(parentMsg)) break;

		thread.value.push(parentMsg);
		currentMsg = parentMsg;
	}

	rootMsgID.value = currentMsg?.id as string;
});

function isChatMessage(msg: Twitch.AnyMessage): msg is Twitch.ChatMessage {
	return (msg as Twitch.ChatMessage).messageType === MessageType.MESSAGE;
}
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
