import { ChangeMap, EventContext } from "..";

export async function onEntitlementCreate(ctx: EventContext, cm: ChangeMap<SevenTV.ObjectKind.ENTITLEMENT>) {
	if (!cm.object) return;

	for (const port of ctx.driver.ports.values()) {
		const platform = port.platform;
		if (!platform) return; // no platform set

		const obj: typeof cm.object = structuredClone(cm.object);
		if (!obj || !obj.user || !obj.user.connections?.length) return;

		const ids = obj.user.connections.filter((x) => x.platform === platform).map((x) => x.id);
		delete obj.user;
		ids.forEach((cid) => {
			// Write to IDB
			ctx.db.entitlements
				.put({
					...obj,
					scope: port.channelIds.map((channelID) => `${platform}:${channelID ?? "X"}`).join(","),
					user_id: cid,
				})
				.catch(() => ctx.db.entitlements.update(obj.id, obj));

			// Send the entitlement to the client
			port.postMessage("ENTITLEMENT_CREATED", {
				id: obj.id,
				kind: obj.kind,
				ref_id: obj.ref_id,
				user_id: cid,
			});
		});
	}
}

export async function onEntitlementDelete(ctx: EventContext, cm: ChangeMap<SevenTV.ObjectKind.ENTITLEMENT>) {
	if (!cm.object) return;

	for (const port of ctx.driver.ports.values()) {
		const platform = port.platform;
		if (!platform) return; // no platform set

		const obj: typeof cm.object = structuredClone(cm.object);
		if (!obj || !obj.user || !obj.user.connections?.length) return;

		obj.user.connections
			.filter((x) => x.platform === platform)
			.map((x) => x.id)
			.forEach((cid) => {
				// Write to IDB
				ctx.db.entitlements.delete(obj.id);

				// Send the entitlement to the client
				port.postMessage("ENTITLEMENT_DELETED", {
					id: obj.id,
					kind: obj.kind,
					ref_id: obj.ref_id,
					user_id: cid,
				});
			});
	}
}
