<template>
	<span ref="buttonsRef" class="seventv-chat-mod-buttons">
		<span
			v-if="msg.author && !msg.author.isActor"
			ref="banRef"
			@click="onMouseClick('ban', $event)"
			@contextmenu="onMouseClick('ban', $event)"
			@mouseenter="banTooltip.show(banRef)"
			@mouseleave="banTooltip.hide()"
		>
			<TwChatModBan />
		</span>

		<span
			v-if="msg.author && !msg.author.isActor"
			ref="timeoutRef"
			@click="onMouseClick('timeout', $event)"
			@contextmenu="onMouseClick('timeout', $event)"
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
	<template v-if="modActionType">
		<Teleport to="#seventv-float-context">
			<UiFloating
				class="seventv-mod-action-reasons-float"
				:anchor="buttonsRef"
				:middleware="[
					offset({ mainAxis: 10 }),
					autoPlacement({ allowedPlacements: ['top-start', 'bottom-start'] }),
				]"
				:emit-clickout="true"
				:once="true"
				@clickout="modActionType = null"
			>
				<ModActionReasons
					:msg="msg"
					:action="modActionType"
					:duration="defaultTimeoutDuration"
					:show-chat-rules="includeChatRules"
					@on:select="onActionSelect"
				/>
			</UiFloating>
		</Teleport>
	</template>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { log } from "@/common/Logger";
import type { ChatMessage } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatModeration } from "@/composable/chat/useChatModeration";
import { useChatTools } from "@/composable/chat/useChatTools";
import { useConfig } from "@/composable/useSettings";
import { useTooltip } from "@/composable/useTooltip";
import TwChatModBan from "@/assets/svg/twitch/TwChatModBan.vue";
import TwChatModDelete from "@/assets/svg/twitch/TwChatModDelete.vue";
import TwChatModTimeout from "@/assets/svg/twitch/TwChatModTimeout.vue";
import TwChatModWarn from "@/assets/svg/twitch/TwChatModWarn.vue";
import ModActionReasons from "./ModActionReasons.vue";
import UiFloating from "@/ui/UiFloating.vue";
import { autoPlacement, offset } from "@floating-ui/dom";

const props = defineProps<{
	msg: ChatMessage;
}>();

const ctx = useChannelContext();
const tools = useChatTools(ctx);
const { banUserFromChat, deleteChatMessage } = useChatModeration(ctx, props.msg.author?.username ?? "");

const buttonsRef = ref<HTMLSpanElement>();
const modActionType = ref<"timeout" | "ban" | null>(null);

const showReasons = useConfig<boolean>("chat.mod_action_reasons");
const includeChatRules = useConfig<boolean>("chat.mod_action_reasons.include_rules");

const defaultTimeoutDuration = useConfig<string>("chat.mod_action.timeout_duration");

const modActionBan = useConfig<0 | 1 | 2>("chat.mod_action_reasons.ban");
const modActionTimeout = useConfig<0 | 1 | 2>("chat.mod_action_reasons.timeout");

function onMouseClick(action: "ban" | "timeout", event: MouseEvent) {
	const setting = action === "ban" ? modActionBan : modActionTimeout;
	const isSettingButton = (event.button === 0 && setting.value === 1) || (event.button === 2 && setting.value === 2);

	if (!showReasons.value) {
		if (event.button === 0) onActionSelect(action);
		return;
	}

	// if the setting of the button that is left-clicked was not set to 'left-click'
	if (event.button === 0 && setting.value !== 1) {
		onActionSelect(action);
		return;
	}

	if (isSettingButton) {
		modActionType.value = action;

		event.preventDefault();
	}
}

function onActionSelect(action: "timeout" | "ban", reason?: string, duration: string = defaultTimeoutDuration.value) {
	switch (action) {
		case "ban": {
			banUserFromChat(null, reason).catch((err) => log.error("failed to ban user", err));
			break;
		}
		case "timeout": {
			banUserFromChat(duration, reason).catch((err) => log.error("failed to timeout user", err));
			break;
		}
	}

	modActionType.value = null;
}

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
