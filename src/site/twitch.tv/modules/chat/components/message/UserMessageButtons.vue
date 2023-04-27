<template>
	<div class="seventv-chat-message-buttons">
		<div
			v-if="showCopyIcon && !msg.moderation.deleted"
			ref="copyButtonRef"
			v-tooltip="'Copy'"
			class="seventv-button"
			@click="copyMessage()"
		>
			<CopyIcon />
		</div>
		<div
			v-if="msg.pinnable && !msg.moderation.deleted"
			ref="pinButtonRef"
			v-tooltip="'Pin'"
			class="seventv-button"
			@click="pinPrompt = true"
		>
			<PinIcon />
		</div>
		<div v-tooltip="'Reply'" class="seventv-button" @click="openReplyTray">
			<component :is="msg.parent ? TwChatReply : ReplyIcon" />
		</div>
	</div>

	<!-- Toast for Copy -->
	<template v-if="copyToastOpen && copyToastContainer">
		<Teleport :to="copyToastContainer">
			<UiCopiedMessageToast title="Message Copied" @close="copyToastOpen = false">
				Message from
				<UserTag v-if="msg.author" :user="msg.author" /> has been copied
			</UiCopiedMessageToast>
		</Teleport>
	</template>

	<!-- Prompt for Pin -->
	<template v-if="pinPrompt && pinPromptContainer">
		<Teleport :to="pinPromptContainer">
			<UiConfirmPrompt
				title="Pin Message?"
				:choices="['yes', 'no']"
				@close="pinPrompt = false"
				@answer="onPinAnswer($event)"
			>
				Are you sure you want to pin this message by
				<UserTag v-if="msg.author" :user="msg.author" />?
			</UiConfirmPrompt>
		</Teleport>
	</template>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTimeoutFn } from "@vueuse/shared";
import type { ChatMessage } from "@/common/chat/ChatMessage";
import { useFloatScreen } from "@/composable/useFloatContext";
import { useConfig } from "@/composable/useSettings";
import CopyIcon from "@/assets/svg/icons/CopyIcon.vue";
import PinIcon from "@/assets/svg/icons/PinIcon.vue";
import ReplyIcon from "@/assets/svg/icons/ReplyIcon.vue";
import TwChatReply from "@/assets/svg/twitch/TwChatReply.vue";
import UserTag from "./UserTag.vue";
import UiConfirmPrompt from "@/ui/UiConfirmPrompt.vue";
import UiCopiedMessageToast from "@/ui/UiCopiedMessageToast.vue";
import { useTray } from "../tray/ChatTray";
import { shift } from "@floating-ui/dom";

const props = defineProps<{
	msg: ChatMessage;
}>();

const emit = defineEmits<{
	(e: "pin"): void;
}>();

const tray = useTray("Reply", () => ({
	id: props.msg.parent?.id ?? props.msg.id,
	body: props.msg.parent?.body ?? props.msg.body,
	deleted: props.msg.parent?.deleted ?? props.msg.moderation.deleted,
	...(props.msg.parent?.author ?? props.msg.author
		? {
				authorID: props.msg.parent?.uid ?? props.msg.author?.id,
				username: props.msg.parent?.author?.username ?? props.msg.author?.username,
				displayName: props.msg.parent?.author?.displayName ?? props.msg.author?.displayName,
		  }
		: {}),
}));

const showCopyIcon = useConfig<boolean>("chat.copy_icon_toggle");
const copyToastOpen = ref(false);
const copyButtonRef = ref<HTMLElement>();
const copyToastContainer = useFloatScreen(copyButtonRef, {
	enabled: () => copyToastOpen.value,
	middleware: [shift({ padding: 8 })],
});

function copyMessage() {
	if (copyToastOpen.value) return;

	navigator.clipboard.writeText(props.msg.body);
	copyToastOpen.value = true;

	useTimeoutFn(() => {
		copyToastOpen.value = false;
	}, 1000);
}

const pinPrompt = ref(false);
const pinButtonRef = ref<HTMLElement>();
const pinPromptContainer = useFloatScreen(pinButtonRef, {
	enabled: () => pinPrompt.value,
	middleware: [shift({ padding: 8 })],
});

function openReplyTray(): void {
	tray.open();
}

function onPinAnswer(answer: string): void {
	if (answer !== "yes") return;

	emit("pin");
}
</script>

<style scoped lang="scss">
.seventv-chat-message-buttons {
	z-index: 10;
	display: flex;
	visibility: hidden;
	gap: 0.5rem;
	position: absolute;
	right: 1rem;
	top: -1rem;
	justify-content: center;
	vertical-align: middle;
	cursor: pointer;

	.seventv-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border-radius: 0.25rem;
		background-color: var(--color-background-body);
		color: var(--seventv-chat-message-buttons-color);
		font-size: 1.25rem;
		fill: currentColor;
		user-select: none;
		z-index: 1;

		&:hover {
			outline: 0.1rem solid var(--seventv-muted);
		}
	}
}
</style>
