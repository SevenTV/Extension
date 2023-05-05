<template>
	<div class="seventv-user-card-message-timeline">
		<section v-for="[date, messages] of Object.entries(timeline).reverse()" :key="date" :timeline-id="date">
			<div selector="date-boundary" />
			<label>{{ date }}</label>
			<div selector="date-boundary" />

			<div class="seventv-user-card-message-timeline-list">
				<UserMessage v-for="msg of messages" :key="msg.sym" :msg="msg" :emotes="emotes.active" />
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import type { ChatMessage } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import UiScrollable from "@/ui/UiScrollable.vue";
import UserMessage from "../message/UserMessage.vue";

defineProps<{
	timeline: Record<string, ChatMessage[]>;
	scroller?: InstanceType<typeof UiScrollable>;
}>();

const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);
</script>

<style scoped lang="scss">
section {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	grid-template-rows: 1fr;
	grid-template-areas:
		"dateboundleft date dateboundright"
		"msg msg msg";
	padding-bottom: 1rem;

	label {
		grid-area: date;
		display: grid;
		justify-items: center;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--seventv-muted);
		margin: 0.5rem 0;
	}

	div:nth-of-type(1) {
		grid-area: dateboundleft;
		height: 0.1rem;
	}
	div:nth-of-type(2) {
		grid-area: dateboundright;
		height: 0.1rem;
	}

	[selector="date-boundary"] {
		height: 0.01rem;
		align-self: center;
		border-bottom: 0.01rem solid rgba(64, 64, 64, 50%);
		margin: 0 0.5rem;
	}

	&[timeline-id="LIVE"] {
		label,
		div[selector="date-boundary"] {
			color: rgb(255, 30, 30);
			border-color: rgb(255, 30, 30);
		}
	}

	.seventv-user-card-message-timeline-list {
		grid-area: msg;
		display: grid;
		row-gap: 1rem;
		margin: 0 0.5rem;
	}
}
</style>
