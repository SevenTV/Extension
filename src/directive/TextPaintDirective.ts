import type { Directive, DirectiveBinding } from "vue";

const ATTR_SEVENTV_PAINT_ID = "data-seventv-cosmetic-paint-id";
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

function updateElementStyles(el: HTMLElement, paintID: string | null): void {
	if (!paintID || (el.hasAttribute(ATTR_SEVENTV_PAINT_ID) && el.getAttribute(ATTR_SEVENTV_PAINT_ID) !== paintID)) {
		el.style.backgroundImage = "";
		el.style.filter = "";
		el.style.color = "";

		el.classList.remove("seventv-painted-content");
		el.removeAttribute(ATTR_SEVENTV_TEXT);
		el.removeAttribute(ATTR_SEVENTV_PAINT_ID);
	}
	if (!paintID) return;

	const varPrefix = `--seventv-paint-${paintID}`;
	const bg = `${varPrefix}-bg`;
	const filter = `${varPrefix}-filter`;
	const color = `${varPrefix}-color`;

	el.style.backgroundImage = `var(${bg})`;
	el.style.filter = `var(${filter})`;
	el.style.color = `var(${color})`;

	el.classList.add("seventv-painted-content");
	el.setAttribute(ATTR_SEVENTV_TEXT, "true");
	el.setAttribute(ATTR_SEVENTV_PAINT_ID, paintID);
}
