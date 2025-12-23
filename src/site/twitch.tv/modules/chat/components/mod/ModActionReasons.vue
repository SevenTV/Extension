<template>
	<span class="seventv-chat-mod-action-reasons">
		<span v-if="action === 'ban' || !duration" class="title"
			>{{ action }} {{ msg.author?.displayName ?? "???" }} for:</span
		>
		<span v-else-if="action === 'timeout'" class="title"
			>{{ action }} {{ msg.author?.displayName ?? "???" }} for {{ duration }} for:</span
		>

		<UiScrollable>
			<span
				v-for="(reason, index) of reasons.length === 0 ? defaultReasons : reasons"
				:key="index"
				class="reason"
				@on:click="emit('select', action, reason, duration)"
			>
				{{ reason }}
			</span>

			<template v-if="showChatRules && properties.chatRules.length > 0">
				<hr />
				<span
					v-for="(reason, index) of properties.chatRules"
					:key="index"
					class="reason"
					@on:click="emit('select', action, reason, duration)"
				>
					{{ reason }}
				</span>
			</template>
		</UiScrollable>
	</span>
</template>

<script setup lang="ts">
import type { ChatMessage } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useConfig } from "@/composable/useSettings";
import UiScrollable from "@/ui/UiScrollable.vue";

defineProps<{
	action: "timeout" | "ban";
	msg: ChatMessage;
	duration?: string;
	showChatRules?: boolean;
}>();

const ctx = useChannelContext();
const properties = useChatProperties(ctx);

const emit = defineEmits<{
	(event: "select", action: "timeout" | "ban", reason: string, duration?: string): void;
}>();

const reasons = useConfig<string[]>("chat.mod_action_reasons.list");

const defaultReasons: string[] = [
	"Spamming",
	"Harassment",
	"Ban Evasion",
	"Impersonation",
	"Botted / Automated Account",
	"Self-promotion",
];
</script>

<style scoped lang="scss">
.seventv-chat-mod-action-reasons {
	display: grid;
	grid-template-rows: min-content 1fr;
	max-height: 45vh;
	border-radius: 0.33rem;
	background-color: var(--seventv-background-transparent-3);
	outline: 0.1em solid var(--seventv-border-transparent-1);

	@at-root .seventv-transparent & {
		backdrop-filter: blur(0.5em);
	}

	.title {
		&::first-letter {
			text-transform: capitalize;
		}

		border-bottom: 0.1em solid var(--seventv-border-transparent-1);
		padding: 0.5em;
	}

	.reason {
		display: block;
		padding: 0.3em 0.5em;

		&:hover {
			background: hsla(0deg, 0%, 90%, 15%);
			cursor: pointer;
		}
	}

	hr {
		height: 0.05em;
		background: var(--seventv-border-transparent-1);
		border: none;
	}
}
</style>
