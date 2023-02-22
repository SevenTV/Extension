<template>
	<main ref="promptRef" class="seventv-confirm-prompt">
		<div v-if="title" class="seventv-confirm-prompt-heading">
			<p>{{ title }}</p>
			<CloseIcon @click="emit('close')" />
		</div>

		<div class="seventv-confirm-prompt-body">
			<p v-if="message">{{ message }}</p>
			<slot v-else />
		</div>

		<div class="seventv-confirm-prompt-choice">
			<button v-for="(c, index) of choices" :key="index" @click="onAnswer(c)">
				{{ c.toUpperCase() }}
			</button>
		</div>
	</main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";

defineProps<{
	title?: string;
	message?: string;
	choices: [positive: string, negative: string];
}>();

const emit = defineEmits<{
	(event: "answer", choice: string): void;
	(event: "close"): void;
}>();

const promptRef = ref<HTMLElement>();

function onAnswer(c: string): void {
	emit("answer", c);
	emit("close");
}

onClickOutside(promptRef, () => {
	emit("close");
});
</script>

<style scoped lang="scss">
main.seventv-confirm-prompt {
	background: var(--seventv-background-transparent-1);
	backdrop-filter: blur(1rem);
	border: 0.15rem solid var(--seventv-border-transparent-1);
	border-radius: 0.25rem;
	max-width: 18rem;
	z-index: 100;

	.seventv-confirm-prompt-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem;
		border-bottom: 0.1rem solid var(--seventv-border-transparent-1);
		background: var(--seventv-background-transparent-2);

		p {
			font-size: 1.5rem;
			font-weight: 600;
		}
		svg {
			font-size: 2rem;
			cursor: pointer;
		}
	}

	.seventv-confirm-prompt-body {
		padding: 0.5rem 1rem;
		border-bottom: 0.1rem solid var(--seventv-border-transparent-1);
		text-align: center;

		p {
			font-size: 1.25rem;
		}
	}

	.seventv-confirm-prompt-choice {
		display: grid;
		gap: 0.5rem;
		grid-template-columns: repeat(2, auto);
		justify-content: flex-end;
		padding: 0.5rem;

		button {
			padding: 0.25rem 0.5rem;
			border: 0.1rem solid var(--seventv-border-transparent-1);
			border-radius: 0.25rem;
			background: var(--seventv-background-transparent-2);
			font-size: 1.25rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease-in-out;

			&:first-child {
				border: 0.1rem solid var(--seventv-accent);
			}

			&:hover {
				background: var(--seventv-highlight-neutral-1);
			}
		}
	}
}
</style>
