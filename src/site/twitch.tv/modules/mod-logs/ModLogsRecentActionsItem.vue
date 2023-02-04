<template>
	<div class="mod-action" :data-seventv-mod-action="getFormattedLabel()">
		<span>
			<UserTag v-if="victim" :user="victim" :color="victim.color" />

			<span class="mod-action-timestamp">{{ timestamp }}</span>
		</span>

		<template v-if="messages.length">
			<div class="mod-action-message-list">
				<UserMessage
					v-for="msg of messages"
					:key="msg.id"
					:msg="msg"
					:hide-author="true"
					:hide-deletion-state="true"
					:hide-moderation="true"
				/>
			</div>
		</template>
		<template v-else>
			<p class="no-messages-recorded">(No Messages Recorded)</p>
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useIntervalFn } from "@vueuse/shared";
import { ChatMessage, ChatMessageModeration, ChatUser } from "@/common/chat/ChatMessage";
import UserMessage from "@/site/twitch.tv/modules/chat/components/message/UserMessage.vue";
import UserTag from "@/site/twitch.tv/modules/chat/components/message/UserTag.vue";
import formatDistance from "date-fns/formatDistance";

const props = defineProps<{
	messages: ChatMessage[];
	victim: ChatUser;
	mod: ChatMessageModeration;
}>();

const timestamp = ref("");

useIntervalFn(
	() => {
		timestamp.value = formatDistance(new Date(props.mod.timestamp), new Date(), {
			addSuffix: true,
			includeSeconds: true,
		});
	},
	5e3,
	{ immediateCallback: true },
);

function getFormattedLabel() {
	return props.mod.actionType + (props.mod.banDuration ? " " + props.mod.banDuration + "s" : "");
}
</script>

<style scoped lang="scss">
.mod-action {
	&::before {
		content: attr(data-seventv-mod-action);
		position: relative;
		right: 0;
		padding: 0.25rem;
		border-radius: 0.25rem;
		font-size: 1rem;
		font-weight: 700;
		background-color: var(--seventv-warning);
		margin-right: 0.5em;
	}

	.mod-action-timestamp {
		margin-left: 0.5rem;
		font-weight: 400;
		color: var(--seventv-muted);
	}

	p.no-messages-recorded {
		font-weight: 400;
		color: var(--seventv-muted);
	}

	.mod-action-message-list {
		margin-top: 0.5rem;
	}
}
</style>
