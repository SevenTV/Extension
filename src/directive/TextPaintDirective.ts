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

type PaintedElement = HTMLElement & {
	__seventv_backup_style?: { backgroundImage: string; filter: string; color: string };
};
export function updateElementStyles(el: PaintedElement, paintID: string | null): void {
	const hasPaint = el.hasAttribute(ATTR_SEVENTV_PAINT_ID);
	const newPaint = hasPaint && paintID !== el.getAttribute(ATTR_SEVENTV_PAINT_ID);

	if (!hasPaint) {
		el.__seventv_backup_style = {
			backgroundImage: el.style.backgroundImage,
			filter: el.style.filter,
			color: el.style.color,
		};
	}

	if (hasPaint && (!paintID || el.getAttribute(ATTR_SEVENTV_PAINT_ID) !== paintID)) {
		const backup = el.__seventv_backup_style;
		el.style.backgroundImage = backup?.backgroundImage ?? "";
		el.style.filter = backup?.filter ?? "";
		el.style.color = backup?.color ?? "";

		el.classList.remove("seventv-painted-content");
		el.removeAttribute(ATTR_SEVENTV_TEXT);
		el.removeAttribute(ATTR_SEVENTV_PAINT_ID);
	}
	if (!paintID) return;

	el.classList.add("seventv-painted-content", "seventv-paint");
	el.setAttribute(ATTR_SEVENTV_TEXT, "true");
	el.setAttribute(ATTR_SEVENTV_PAINT_ID, paintID);
}
