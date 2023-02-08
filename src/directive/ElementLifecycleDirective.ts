import type { Directive, DirectiveBinding } from "vue";

export const ElementLifecycleDirective = {
	mounted(el: HTMLElement, binding: DirectiveBinding<Callback>) {
		const { value: cb } = binding;

		cb("mounted", el);
	},
	updated(el: HTMLElement, binding: DirectiveBinding<Callback>) {
		const { value: cb } = binding;

		cb("updated", el);
	},
	beforeUnmount(el: HTMLElement, binding: DirectiveBinding<Callback>) {
		const { value: cb } = binding;

		cb("unmounted", el);
	},
} as Directive<HTMLElement, Callback>;

type Callback = (state: ElementLifecycle, el: HTMLElement) => void;

export type ElementLifecycle = "mounted" | "updated" | "unmounted";
