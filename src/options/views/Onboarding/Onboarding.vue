<template>
	<main class="onboarding">
		<div v-if="ctx.activeStep" class="active-content">
			<Transition name="step-animation" mode="out-in">
				<KeepAlive>
					<component :is="ctx.activeStep.component" @completed="toStep(1)" />
				</KeepAlive>
			</Transition>
		</div>

		<div v-if="ctx.activeStep" class="onboarding-stepper" :class="{ 'at-start': ctx.activeStep.order === 0 }">
			<UiButton class="ui-button-hollow" @click="toStep(-1)">
				<span>Back</span>
			</UiButton>

			<div>
				<RouterLink
					v-for="step of ctx.sortedSteps"
					:key="step.name"
					v-tooltip="step.name.charAt(0).toUpperCase() + step.name.slice(1)"
					:to="{ name: 'Onboarding', params: { step: step.name } }"
					active-class="active"
					:completed="step.completed"
					:style="{
						backgroundColor: step.color,
					}"
				/>
			</div>

			<UiButton class="ui-button-important" @click="isAtEnd ? exit() : toStep(1)">
				<template #icon>
					<ChevronIcon direction="right" />
				</template>

				<span>{{ isAtEnd ? "Done" : "Next" }}</span>
			</UiButton>
		</div>
	</main>
</template>

<script setup lang="ts">
import { markRaw, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { until } from "@vueuse/core";
import ChevronIcon from "@/assets/svg/icons/ChevronIcon.vue";
import { OnboardingStepRoute, createOnboarding } from "./Onboarding";
import UiButton from "@/ui/UiButton.vue";

const ctx = createOnboarding();
const route = useRoute();
const router = useRouter();
const isAtEnd = ref(false);

// Load step data from components
const loadedSteps = import.meta.glob("./Onboarding*.vue", { eager: true });
for (const step of Object.values(loadedSteps) as { default: ComponentFactory; step: OnboardingStepRoute }[]) {
	const def = step.step as OnboardingStepRoute;
	const component = step.default;
	if (!def || !(def.name && typeof def.order === "number") || !component) continue;

	ctx.steps.set(
		def.name,
		reactive({
			name: def.name,
			order: def.order,
			component: markRaw(component),
			locked: false,
			completed: false,
			active: false,
			color: def.color,
		}),
	);
}

function toStep(delta: number): void {
	if (!ctx) return;

	const currentStep = ctx.activeStep;
	if (!currentStep) return;

	const i = ctx.sortedSteps.indexOf(currentStep);
	if (i === -1) return;

	const nextStep = ctx.sortedSteps[i + delta];
	if (!nextStep) return;

	if (delta < 0) {
		currentStep.locked = false;
	} else {
		ctx.onMove?.();
	}

	until(() => currentStep.locked)
		.not.toBeTruthy()
		.then(() => {
			router.push({ name: "Onboarding", params: { step: nextStep.name } });
		});
}

// Completely exit the onboarding app by closing the tab
function exit(): void {
	chrome.tabs.getCurrent((tab) => {
		if (!tab || typeof tab.id !== "number") return;
		chrome.tabs.remove(tab.id);
	});
}

// Watch route change and apply new component
watch(
	() => route.params.step as string,
	(step) => {
		ctx.activeStep = ctx.steps.get(step) ?? null;
		if (ctx.activeStep?.name === "end") {
			isAtEnd.value = true;
		}
	},
	{ immediate: true },
);

// Sort steps by defined order
watch(
	ctx.steps,
	(steps) => {
		ctx.sortedSteps = [...steps.values()].sort((a, b) => a.order - b.order);
	},
	{
		immediate: true,
	},
);
</script>

<style scoped lang="scss">
.step-animation-enter-active {
	transition: all 0.4s cubic-bezier(0, 0.67, 0.24, 1.36);
}

.step-animation-leave-active {
	transition: all 0.8s cubic-bezier(0.62, -1.41, 0.47, 1.35);
}

.step-animation-enter-from,
.step-animation-leave-to {
	filter: blur(3rem);
	transform: translateY(4rem) scaleY(0.92);
	opacity: 0;
}

main.onboarding {
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow: hidden;

	.active-content {
		display: flex;
		flex-grow: 1;
		margin-bottom: 4rem;
		overflow-y: auto;
	}

	.onboarding-stepper {
		position: fixed;
		bottom: 0;
		min-height: 6rem;

		display: flex;
		width: 100%;
		justify-content: space-evenly;
		align-items: center;
		background: rgba(0, 0, 0, 10%);
		backdrop-filter: blur(2rem);

		> div {
			display: flex;
			align-items: middle;
		}
		a {
			display: inline-block;
			width: max(1rem, 1.25vw);
			height: max(1rem, 1.25vw);
			clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
			background: var(--seventv-muted);
			margin: 0 0.25vw;

			transition: background 0.25s ease, transform 140ms ease;
			&:hover {
				cursor: pointer;
				background: var(--seventv-text-color-normal);
				transform: scale(1.15);
			}

			&.active {
				background: var(--seventv-text-color-normal);
				transform: scale(1.25);
			}

			&[completed="true"] {
				background: var(--seventv-accent);
			}
		}

		button {
			font-size: max(1rem, 1vw);
			height: 2.5em;
			padding: 0 2vw;
		}
		&.at-start {
			button {
				display: none;
			}
		}
	}
}
</style>
