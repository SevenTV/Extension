<template>
	<main ref="copiedMessageToastRef" class="seventv-copied-message-toast">
		<div class="seventv-copied-message-toast-body">
			<p v-if="message">{{ message }}</p>
			<slot v-else />
		</div>
	</main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";

const copiedMessageToastRef = ref<HTMLElement>();

defineProps<{
	message?: string;
}>();

const emit = defineEmits<{
	(event: "close"): void;
}>();

onClickOutside(copiedMessageToastRef, () => {
	emit("close");
});
</script>

<style scoped lang="scss">
main.seventv-copied-message-toast {
	background: var(--seventv-background-transparent-1);
	backdrop-filter: blur(1rem);
	border: 0.15rem solid var(--seventv-border-transparent-1);
	border-radius: 0.25rem;
	max-width: 18rem;
	z-index: 100;
	opacity: 1;

	.seventv-copied-message-toast-body {
		padding: 0.5rem 1rem;
		border-bottom: 0.1rem solid var(--seventv-border-transparent-1);
		text-align: center;

		p {
			font-size: 1.25rem;
		}
	}
}
</style>
