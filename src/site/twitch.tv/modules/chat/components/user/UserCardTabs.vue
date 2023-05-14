<template>
	<div class="seventv-user-card-tabs">
		<button
			v-for="btn of buttons"
			:key="btn.label"
			:selected="activeTab === btn.id"
			@click="emit('switch', btn.id)"
		>
			{{ formatCount(btn.count, btn.maxCount) }}
			<p>{{ btn.label }}</p>
		</button>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export type UserCardTabName = "messages" | "timeouts" | "bans" | "comments";

const props = defineProps<{
	activeTab: UserCardTabName;
	messageCount: number;
	timeoutCount: number;
	banCount: number;
	commentCount: number;
}>();

const emit = defineEmits<{
	(e: "switch", tab: UserCardTabName): void;
}>();

const buttons = computed(
	() =>
		[
			{ id: "messages", label: "Messages", count: props.messageCount, maxCount: 1000 },
			{ id: "timeouts", label: "Timeouts", count: props.timeoutCount, maxCount: 99 },
			{ id: "bans", label: "Bans", count: props.banCount, maxCount: 99 },
			{ id: "comments", label: "Comments", count: props.commentCount, maxCount: 10 },
		] as { id: UserCardTabName; label: string; count: number; maxCount: number }[],
);

function formatCount(count: number, maxCount: number): string {
	return count >= maxCount ? maxCount.toString() + "+" : count.toString();
}
</script>

<style scoped lang="scss">
.seventv-user-card-tabs {
	border-top: 0.1rem solid hsla(0deg, 0%, 100%, 10%);
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	grid-template-areas: ". . . .";
	height: 4rem;
	box-shadow: 0 0.25rem 0.25rem rgba(0, 0, 0, 35%);
	background-color: var(--seventv-background-transparent-1);
}

button {
	cursor: pointer;
	background: transparent;
	border: none;
	outline: none;
	font-size: 1rem;
	font-weight: 400;
	color: var(--seventv-muted);
	transition: color 0.2s ease-in-out;
	padding: 0 1rem;
	padding-bottom: 0.15rem;

	p {
		font-size: 1rem;
		font-weight: 900;
		color: var(--seventv-text-color-muted);
	}

	&[selected="true"] {
		color: var(--seventv-text-color-normal);
		border-bottom: 0.15rem solid var(--seventv-primary);
		padding-bottom: 0;
	}

	&:hover {
		color: var(--seventv-text-color-normal);
	}
}
</style>
