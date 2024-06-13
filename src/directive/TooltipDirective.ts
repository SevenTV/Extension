import type { Directive, DirectiveBinding } from "vue";
import { useTooltip } from "@/composable/useTooltip";
import { Placement } from "@floating-ui/dom";

export const TooltipDirective = {
	mounted(el: HTMLElement, binding: DirectiveBinding) {
		handleTooltip(el, binding);
	},
	updated(el: HTMLElement, binding: DirectiveBinding) {
		handleTooltip(el, binding);
	},
	beforeUnmount() {
		useTooltip().hide();
	},
} as Directive;

function handleTooltip(el: HTMLElement, binding: DirectiveBinding) {
	const tooltipText = binding.value || "";

	switch (binding.arg) {
		case "position":
			el.setAttribute("data-tooltip-position", binding.value);
			break;
		default: {
			const { show, hide } = useTooltip(tooltipText, undefined, {
				placement: (el.getAttribute("data-tooltip-position") as Placement) || binding.arg,
			});

			el.addEventListener("mouseenter", () => show(el));
			el.addEventListener("mouseleave", hide);
			break;
		}
	}
}
