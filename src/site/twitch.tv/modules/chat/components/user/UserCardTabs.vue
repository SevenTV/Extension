<template>
	<div class="seventv-user-card-tabs">
		<button
			v-for="btn of buttons"
			:key="btn.label"
			:selected="activeTab === btn.id"
			@click="emit('switch', btn.id)"
		>
			{{ formatCount(btn.count) }}
			<p>{{ btn.label }}</p>
		</button>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";

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

export type UserCardTabName = "messages" | "timeouts" | "bans" | "comments";

const buttons = computed(
	() =>
		[
			{ id: "messages", label: "Messages", count: props.messageCount },
			{ id: "timeouts", label: "Timeouts", count: props.timeoutCount },
			{ id: "bans", label: "Bans", count: props.banCount },
			{ id: "comments", label: "Comments", count: props.commentCount },
		] as { id: UserCardTabName; label: string; count: number }[],
);

function formatCount(count: number): string {
	return count >= 1000 ? "1000+" : count.toString();
}
</script>

<style scoped lang="scss">
.seventv-user-card-tabs {
	height: 100%;

	display: grid;
	grid-template-columns: repeat(4, 1fr);
	grid-template-areas: ". . . .";

	// downwards shadow
	box-shadow: -0rem 0.25rem 0.25rem rgba(0, 0, 0, 0.35);
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
