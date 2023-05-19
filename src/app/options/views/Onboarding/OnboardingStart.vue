<template>
	<main class="onboarding-start">
		<div class="feature-logo">
			<Logo7TV />
		</div>
		<div class="feature-text">
			<h1 v-t="isUpgraded ? 'onboarding.start_title_upgraded' : 'onboarding.start_title'" />
			<p v-t="isUpgraded ? 'onboarding.start_subtitle_upgraded' : 'onboarding.start_subtitle'" />

			<span>
				<span v-t="isUpgraded ? 'onboarding.start_skip_note_upgraded' : 'onboarding.start_skip_note'" />
				<span
					v-if="isUpgraded"
					v-t="'onboarding.start_skip_note_upgraded_quirky'"
					:style="{ marginLeft: '0.5rem', fontSize: '0.75rem' }"
				/>
			</span>
		</div>

		<div class="feature-buttons">
			<UiButton class="ui-button-hollow" @click="skipConfig">
				<span v-t="'onboarding.button_skip'" />
			</UiButton>

			<RouterLink :to="{ name: 'Onboarding', params: { step: isUpgraded ? 'changelog' : 'platforms' } }">
				<UiButton class="ui-button-important">
					<span v-t="isUpgraded ? 'onboarding.button_changelog' : 'onboarding.button_platforms'" />
					<template #icon>
						<ChevronIcon direction="right" />
					</template>
				</UiButton>
			</RouterLink>
		</div>
	</main>
</template>

<script setup lang="ts">
import { useHead } from "@vueuse/head";
import ChevronIcon from "@/assets/svg/icons/ChevronIcon.vue";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import { ONBOARDING_UPGRADED, useOnboarding } from "./Onboarding";
import UiButton from "@/ui/UiButton.vue";

useHead({
	title: "Onboarding",
});

useOnboarding("start");
const isUpgraded = inject(ONBOARDING_UPGRADED, ref(false));

const router = useRouter();
function skipConfig(): void {
	router.push({ name: "Onboarding", params: { step: "promotion" } });
}
</script>

<script lang="ts">
import { inject, ref } from "vue";
import { useRouter } from "vue-router";
import { OnboardingStepRoute } from "./Onboarding";

export const step: OnboardingStepRoute = {
	name: "start",
	order: 0,
};
</script>

<style scoped lang="scss">
main.onboarding-start {
	display: grid;
	grid-template-columns: 40% 60%;
	grid-template-rows: repeat(2, auto);
	margin: 5%;
	width: 100%;

	.feature-logo {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 25vw;
		margin: -2rem;
		grid-area: 1 / 1 / 3 / 2;
	}

	.feature-text {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		font-size: 2vw;

		> span {
			font-size: 1vw;
			color: var(--seventv-muted);
		}
	}

	.feature-buttons {
		display: flex;
		justify-content: flex-end;
		column-gap: 2vw;
		margin: 2rem 3rem;
		height: 3vw;
		font-size: 1vw;

		a {
			all: unset;
		}
	}

	@media screen and (width <= 800px) {
		grid-template-columns: 100%;
		grid-template-rows: repeat(4, auto);

		.feature-logo {
			font-size: 50vw;
			margin: -1rem;
		}

		.feature-text {
			font-size: 4vw;

			> span {
				font-size: 2vw;
			}
		}
	}
}
</style>
