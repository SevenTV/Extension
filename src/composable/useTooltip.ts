import { Component, markRaw, nextTick, reactive } from "vue";
import { Placement, computePosition, shift } from "@floating-ui/dom";

export const tooltip = reactive({
	x: 0,
	y: 0,
	content: null as Component | string | null,
	contentProps: {} as Record<string, unknown>,
	container: null as HTMLElement | null,
});

/**
 * useTooltip() is a composable function to display tooltips efficiently
 *
 * @param content text, or a component, to display as the tooltip content
 * @param props if content is a component, these are the props to pass to it
 * @returns
 */
export function useTooltip(content?: string | Component, props?: Record<string, unknown>, opt?: TooltipOptions) {
	// this shows the tooltip
	function show(el: HTMLElement | undefined): void {
		if (!el) return;

		// Set the content, this is necessary to calculate the tooltip's positioning
		if (content) {
			tooltip.content = typeof content === "string" ? content : markRaw(content);
			tooltip.contentProps = props ?? {};
		}

		// on the next tick we will update the position of the tooltip container
		nextTick(() => {
			computePosition(el, tooltip.container as HTMLElement, {
				placement: opt?.placement ?? "top",
				middleware: [shift({ padding: 8, crossAxis: true, mainAxis: true })],
			}).then(({ x: xVal, y: yVal }) => {
				tooltip.x = xVal;
				tooltip.y = yVal;
			});
		});
	}

	// this hides the tooltip
	function hide(): void {
		tooltip.content = null;
		tooltip.contentProps = {};
	}

	return { show, hide };
}

interface TooltipOptions {
	placement?: Placement;
}
