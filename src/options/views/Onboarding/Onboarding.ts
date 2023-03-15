import { InjectionKey, Ref, inject, provide, reactive } from "vue";
import { tryOnUnmounted } from "@vueuse/core";

const ONBOARDING_KEY = Symbol() as InjectionKey<OnboardingData>;
export const ONBOARDING_UPGRADED = Symbol() as InjectionKey<Ref<boolean>>;

interface OnboardingData {
	activeStep: OnboardingStep | null;
	steps: Map<string, OnboardingStep>;
	sortedSteps: OnboardingStep[];
	onMove?: () => void;
}

export interface OnboardingStep {
	name: string;
	component: ComponentFactory;
	order: number;
	locked: boolean;
	completed: boolean;
	active: boolean;
	color?: string;
}

export type OnboardingStepRoute = Pick<OnboardingStep, "name" | "order" | "color">;

export function createOnboarding(): OnboardingData {
	let o = inject(ONBOARDING_KEY, null);
	if (!o) {
		o = reactive<OnboardingData>({
			activeStep: null,
			steps: new Map(),
			sortedSteps: [],
		});

		provide(ONBOARDING_KEY, o);
	}

	return o;
}

export function useOnboarding(stepName: string) {
	const ctx = inject(ONBOARDING_KEY);
	if (!ctx) {
		throw new Error("Onboarding not in context");
	}

	const step = ctx.steps.get(stepName);
	if (!step) {
		throw new Error("Unknown Step");
	}

	step.active = true;

	function setCompleted(value: boolean): void {
		if (step) {
			step.completed = value;
		}
	}

	function setLock(value: boolean, onMove?: () => void): void {
		if (!ctx || !step) return;

		step.locked = value;
		ctx.onMove = onMove;
		if (onMove) {
			tryOnUnmounted(() => {
				ctx.onMove = undefined;
			});
		}
	}

	return {
		setCompleted,
		setLock,
	};
}
