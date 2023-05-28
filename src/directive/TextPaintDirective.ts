import type { Directive, DirectiveBinding } from "vue";

const ATTR_SEVENTV_PAINT_ID = "data-seventv-paint-id";
const ATTR_SEVENTV_TEXT = "data-seventv-painted-text";

export const TextPaintDirective = {
	mounted(el: HTMLElement, binding: DirectiveBinding<string | null>) {
		const { value: paint } = binding;

		updateElementStyles(el, paint);
	},
	updated(el: HTMLElement, binding: DirectiveBinding<string | null>) {
		const { value: paint } = binding;

		updateElementStyles(el, paint);
	},
} as Directive<HTMLElement, string | null>;

export function updateElementStyles(el: HTMLElement, paintID: string | null): void {
	if (!paintID || (el.hasAttribute(ATTR_SEVENTV_PAINT_ID) && el.getAttribute(ATTR_SEVENTV_PAINT_ID) !== paintID)) {
		el.style.backgroundImage = "";
		el.style.filter = "";
		el.style.color = "";

		el.classList.remove("seventv-painted-content");
		el.removeAttribute(ATTR_SEVENTV_TEXT);
		el.removeAttribute(ATTR_SEVENTV_PAINT_ID);
	}
	if (!paintID) return;

	el.classList.add("seventv-painted-content", "seventv-paint");
	el.setAttribute(ATTR_SEVENTV_TEXT, "true");
	el.setAttribute(ATTR_SEVENTV_PAINT_ID, paintID);
}
