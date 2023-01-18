<template>
	<div class="seventv-chat-message-container">
		<!-- Reply button-->
		<div class="seventv-reply-button-container" @click="set">
			<div class="seventv-reply-button">
				<component :is="msg.reply ? TwChatReply : TwReply" />
			</div>
		</div>
		<div class="seventv-chat-message-background" tabindex="0">
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
import { computed } from "vue";
import { useTray } from "@/composable/tray/useTray";
import { useConfig } from "@/composable/useSettings";
import TwChatReply from "@/assets/svg/twitch/TwChatReply.vue";
import TwReply from "@/assets/svg/twitch/TwReply.vue";
import UserMessage from "../message/UserMessage.vue";

const props = defineProps<{
	msg: Twitch.ChatMessage;
}>();

const paddingStyle = useConfig<number>("chat.padding");

// (paddingStyle.value ? "0rem" : "1rem")
const sidePadding = computed(
	() =>
		({
			0: "0",
			1: "1rem",
		}[paddingStyle.value]),
);

const { set } = useTray("Reply", { msg: props.msg });
</script>
<style scoped lang="scss">
.seventv-chat-message-container {
	display: block;
	position: relative;
	overflow-wrap: anywhere;
	padding: 0 v-bind(sidePadding);

	&:hover,
	&:focus-within {
		.seventv-chat-message-background {
			border-radius: 0.4rem;
			background: hsla(0deg, 0%, 60%, 24%);
		}
		.seventv-reply-button-container {
			display: flex;
		}
	}
	.seventv-reply-button-container {
		z-index: 10;
		display: none;
		position: absolute;
		right: 1rem;
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

	.seventv-chat-message-background {
		position: relative;
		padding: 0.5rem 1rem;

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
	}
}
</style>
