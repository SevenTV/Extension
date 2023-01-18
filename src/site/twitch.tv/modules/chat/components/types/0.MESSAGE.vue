<template>
	<div class="seventv-chat-message-container">
		<div class="seventv-chat-message-background" tabindex="0">
			<!-- Reply button-->
			<div class="seventv-reply-button-container" @click="set">
				<div class="seventv-reply-button">
					<component :is="msg.reply ? TwChatReply : TwReply" />
				</div>
			</div>

			<div v-if="msg.reply" class="seventv-reply-part">
				<div class="seventv-chat-reply-icon">
					<TwChatReply />
				</div>
				<div class="seventv-reply-message-part">
					{{ `Replying to @${msg.reply.parentDisplayName}: ${msg.reply.parentMessageBody}` }}
				</div>
			</div>
			<UserMessage :msg="msg" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { useTray } from "@/composable/tray/useTray";
import TwChatReply from "@/assets/svg/twitch/TwChatReply.vue";
import TwReply from "@/assets/svg/twitch/TwReply.vue";
import UserMessage from "../message/UserMessage.vue";

const props = defineProps<{
	msg: Twitch.ChatMessage;
}>();
const { set } = useTray("Reply", { msg: props.msg });
</script>
<style scoped lang="scss">
.seventv-chat-message-container {
	display: block;
	padding: 0 1rem;
	overflow-wrap: anywhere;

	.seventv-chat-message-background {
		position: relative;
		padding: 0.5rem 1rem;

		&:hover,
		&:focus-within {
			border-radius: 0.4rem;
			background: hsla(0deg, 0%, 60%, 24%);
			.seventv-reply-button-container {
				display: flex;
			}
		}

		.seventv-reply-part {
			display: flex;
			font-size: 1.2rem;
			color: var(--color-text-alt-2);

			.seventv-chat-reply-icon {
				align-items: center;
				fill: currentColor;
				display: inline-flex;
			}

			.seventv-reply-message-part {
				text-overflow: ellipsis;
				overflow: clip;
				white-space: nowrap;
				margin-left: 0.5rem;
			}
		}

		.seventv-reply-button-container {
			display: none;
			position: absolute;
			right: 0;
			top: -1rem;
			width: 3rem;
			height: 3rem;
			background-color: var(--color-background-body);
			box-shadow: var(--shadow-elevation-1);
			border-radius: 0.4rem;
			justify-content: center;
			vertical-align: middle;
			cursor: pointer;

			.seventv-reply-button {
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100%;
				width: 100%;
				font-size: 1.5em;
				fill: currentColor;
				user-select: none;
				z-index: 1;

				&:hover {
					background-color: hsla(0deg, 0%, 60%, 24%);
					border-radius: 0.4rem;
				}
			}
		}
	}
}
</style>
