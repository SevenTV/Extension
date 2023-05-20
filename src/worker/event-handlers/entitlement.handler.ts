import { ChangeMap, EventContext } from "..";

export async function onEntitlementCreate(ctx: EventContext, cm: ChangeMap<SevenTV.ObjectKind.ENTITLEMENT>) {
	if (!cm.object) return;

	for (const port of ctx.driver.ports.values()) {
		const platform = port.platform;
		if (!platform) return; // no platform set

		const obj: typeof cm.object = structuredClone(cm.object);
		if (!obj || !obj.user || !obj.user.connections?.length) return;

		const cid = obj.user.connections.find((x) => x.platform === platform)?.id ?? "";

		// Write to IDB
		delete obj.user;
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
	}
}

export async function onEntitlementDelete(ctx: EventContext, cm: ChangeMap<SevenTV.ObjectKind.ENTITLEMENT>) {
	if (!cm.object) return;

	for (const port of ctx.driver.ports.values()) {
		const platform = port.platform;
		if (!platform) return; // no platform set

		const obj: typeof cm.object = structuredClone(cm.object);
		if (!obj || !obj.user || !obj.user.connections?.length) return;

		const cid = obj.user.connections.find((x) => x.platform === platform)?.id ?? "";

		// Write to IDB
		ctx.db.entitlements.delete(obj.id);

		// Send the entitlement to the client
		port.postMessage("ENTITLEMENT_DELETED", {
			id: obj.id,
			kind: obj.kind,
			ref_id: obj.ref_id,
			user_id: cid,
		});
	}
}
