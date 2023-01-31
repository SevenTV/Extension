import { log } from "@/common/Logger";
import { ChangeMap, EventContext } from "..";

export function onCosmeticCreate(ctx: EventContext, cm: ChangeMap<SevenTV.ObjectKind.COSMETIC>) {
	if (!cm.object) return;

	// Insert the cosmetic into the database
	ctx.db
		.withErrorFallback(ctx.db.cosmetics.put(cm.object), () =>
			ctx.db.cosmetics.where("id").equals(cm.object.id).modify(cm.object),
		)
		.catch((err) => log.error("<EventAPI>", "Failed to insert cosmetic", err));

	for (const port of ctx.driver.ports.values()) {
		port.postMessage("COSMETIC_CREATED", cm.object as SevenTV.Cosmetic<"AVATAR" | "BADGE" | "PAINT">);
	}
}
