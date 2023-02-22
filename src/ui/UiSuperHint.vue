<template>
	<main class="seventv-super-hint">
		<div class="seventv-super-hint-heading">
			<Logo provider="7TV" />
			<span>{{ title }}</span>
		</div>

		<div class="seventv-super-hint-content">
			<slot />
		</div>
	</main>
</template>

<script setup lang="ts">
import Logo from "@/assets/svg/logos/Logo.vue";

defineProps<{
	title: string;
}>();
</script>

<style scoped lang="scss">
main.seventv-super-hint {
	background: var(--seventv-background-transparent-1);
	backdrop-filter: blur(1rem);
	border-radius: 0.25rem;
	outline: 0.01rem solid var(--seventv-border-transparent-1);
	overflow: clip;
	max-width: 24rem;

	.seventv-super-hint-heading {
		display: grid;
		padding: 0.5rem;
		grid-template-columns: 2rem auto;
		gap: 0.5rem;
		background: var(--seventv-background-transparent-2);
		backdrop-filter: blur(1rem);
		align-items: center;
		text-align: center;
		font-size: 1.25rem;
		font-weight: 600;
		width: 100%;
		border-bottom: 0.1rem solid var(--seventv-border-transparent-1);

		> svg {
			width: 100%;
			font-size: 2rem;
		}
	}
}
</style>
