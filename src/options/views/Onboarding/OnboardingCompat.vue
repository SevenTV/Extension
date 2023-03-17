<template>
	<main class="onboarding-compat">
		<div class="header">
			<h1 v-t="'onboarding.compat_title'" />
			<p v-t="'onboarding.compat_subtitle'" />
		</div>

		<div class="compat">
			<Compat :internal="true" @skip="emit('completed')" />
		</div>
	</main>
</template>

<script setup lang="ts">
import { onDeactivated } from "vue";
import Compat from "../Compat/Compat.vue";
import { OnboardingStepRoute, useOnboarding } from "./Onboarding";

const emit = defineEmits<{
	(e: "completed"): void;
}>();

const ctx = useOnboarding("compatibility");

onDeactivated(() => {
	ctx.setCompleted(true);
});
</script>

<script lang="ts">
export const step: OnboardingStepRoute = {
	name: "compatibility",
	order: 4,
};
</script>

<style scoped lang="scss">
main.onboarding-compat {
	width: 100%;
	display: grid;
	grid-template-rows: 20% 80%;
	grid-template-areas:
		"header"
		"compat";

	.header {
		grid-area: header;
		justify-self: center;
		align-self: center;
		text-align: center;
		max-width: 40vw;

		h1 {
			font-size: 4vw;
		}
		p {
			font-size: 1vw;
		}
	}

	.compat {
		grid-area: compat;
		margin: 0 10%;
	}
}
</style>
