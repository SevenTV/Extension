<template>
	<main class="onboarding-changelog">
		<Changelog :no-header="true" />
	</main>
</template>

<script setup lang="ts">
import Changelog from "@/site/global/Changelog.vue";

const { setCompleted } = useOnboarding("changelog");

onDeactivated(() => {
	setCompleted(true);
});
</script>

<script lang="ts">
import { onDeactivated } from "vue";
import { OnboardingStepRoute, useOnboarding } from "./Onboarding";

export const step: OnboardingStepRoute = {
	name: "changelog",
	order: 0.5,
};
</script>

<style scoped lang="scss">
main {
	display: grid;
	justify-content: center;
	max-width: 44rem;
	margin: 0 20%;

	@media screen and (width <= 1000px) {
		margin: 0 1rem;
	}
}
</style>
