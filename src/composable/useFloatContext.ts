import { InjectionKey, Ref, onUnmounted, reactive, toRef, watch } from "vue";
import type { Middleware, Placement } from "@floating-ui/dom";

export const FLOAT_CONTEXT_KEY: InjectionKey<FloatContext> = Symbol("seventv-float-context");

export interface FloatContext {
	screens: FloatScreen[];
	screenMap: Record<symbol, FloatScreen>;
}

export interface FloatScreen {
	sym: symbol;
	anchor: Element | null;
	teleportContainer: Element | null;
	placement: Placement;
	middleware?: Middleware[];
}

const data = reactive<FloatContext>({
	screens: [],
	screenMap: {},
});

export function useFloatContext(): FloatContext {
	return data;
}

export function useFloatScreen(anchor: Ref<Element | null | undefined>, opt: FloatScreenOptions): Ref<Element | null> {
	const ctx = useFloatContext();

	// Initialize new screen instance
	const sym = Symbol("seventv-float-screen");
	const screen = reactive<FloatScreen>({
		sym,
		anchor: null,
		teleportContainer: null,
		placement: opt.placement ?? "top",
		middleware: opt.middleware,
	});

	// Remove screen from the context
	function unset(): void {
		const index = ctx.screens.indexOf(screen);
		if (index !== -1) {
			ctx.screens.splice(index, 1);
		}
		delete ctx.screenMap[sym];
	}

	// The screen is disabled until the enabled function returns true
	watch(
		opt.enabled,
		(enabled) => {
			if (!enabled) {
				unset();

				return;
			}

			// Assign new screen to the context
			ctx.screens.push(screen);
			ctx.screenMap[sym] = screen;
		},
		{
			immediate: true,
		},
	);

	// Watch for anchor changes
	watch(
		anchor,
		(el) => {
			if (!el) return;

			screen.anchor = el as Element;
		},
		{ immediate: true },
	);

	onUnmounted(() => {
		unset();
	});

	// Return teleport container container
	return toRef(screen, "teleportContainer");
}

interface FloatScreenOptions {
	placement?: Placement;
	middleware?: Middleware[];
	enabled: () => boolean;
}
