import { log } from "@/common/Logger";
import { onCosmeticCreate } from "./cosmetic.handler";
import { onEmoteSetCreate, onEmoteSetUpdate } from "./emote-set.handler";
import { onEntitlementCreate, onEntitlementDelete } from "./entitlement.handler";
import { onUserUpdate } from "./user.handler";
import type { ChangeField, ChangeMap, EventContext, ObjectTypeOfKind } from "../";

export function handleDispatchedEvent(ctx: EventContext, type: string, cm: ChangeMap<SevenTV.ObjectKind>) {
	const h = {
		"user.update": () => onUserUpdate(ctx, cm as ChangeMap<SevenTV.ObjectKind.USER>),
		"cosmetic.create": () => onCosmeticCreate(ctx, cm as ChangeMap<SevenTV.ObjectKind.COSMETIC>),
		"entitlement.create": () =>
			onEntitlementCreate(ctx, structuredClone(cm) as ChangeMap<SevenTV.ObjectKind.ENTITLEMENT>),
		"entitlement.delete": () =>
			onEntitlementDelete(ctx, structuredClone(cm) as ChangeMap<SevenTV.ObjectKind.ENTITLEMENT>),
		"emote_set.create": () => onEmoteSetCreate(ctx, cm as ChangeMap<SevenTV.ObjectKind.EMOTE_SET>),
		"emote_set.update": () => onEmoteSetUpdate(ctx, cm as ChangeMap<SevenTV.ObjectKind.EMOTE_SET>),
	}[type];

	if (typeof h === "function") h();
	else log.warn("<Net/EventAPI>", `Received dispatch '${type}' but no handler was found`);
}

export async function iterateChangeMap<T extends SevenTV.ObjectKind>(cm: ChangeMap<T>, h: ChangeMapHandler<T>) {
	const promises = [] as Promise<void>[];
	for (const v of Object.values(h)) {
		const hook = v as ChangeMapHook;

		for (const x of cm.pulled ?? []) {
			const p = hook.pulled?.(x.value, x.old_value);
			if (p instanceof Promise) {
				promises.push(p);
			}
		}
		for (const x of cm.pushed ?? []) {
			const p = hook.pushed?.(x.value, x.old_value);
			if (p instanceof Promise) {
				promises.push(p);
			}
		}

		for (const x of cm.updated ?? []) {
			const p = hook.updated?.(x.value, x.old_value, x);
			if (p instanceof Promise) {
				promises.push(p);
			}
		}
	}

	await Promise.allSettled(promises);
}

export type ChangeMapHandler<T extends SevenTV.ObjectKind> = {
	[Property in keyof ObjectTypeOfKind[T]]?: ChangeMapHook;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ChangeMapHook {
	pulled?: (newValue: any, oldValue: any) => void | Promise<void>;
	pushed?: (newValue: any, oldValue: any) => void | Promise<void>;
	updated?: (newValue: any, oldValue: any, field?: ChangeField) => void | Promise<void>;
}
