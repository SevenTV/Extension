import { ChangeMap, EventContext } from "..";

export async function onEntitlementCreate(ctx: EventContext, cm: ChangeMap<SevenTV.ObjectKind.ENTITLEMENT>) {
	if (!cm.object) return;

	for (const port of ctx.driver.ports.values()) {
		const platform = port.platform;
		if (!platform) return; // no platform set

		const obj: typeof cm.object = structuredClone(cm.object);
		if (!obj || !obj.user || !obj.user.connections?.length) return;

		const ids = obj.user.connections.filter((x) => x.platform === platform).map((x) => x.id);
		const user_id = obj.user.id;
		delete obj.user;
		ids.forEach((cid) => {
			// Write to IDB
			obj.id = `${cid}:${obj.kind}:${obj.ref_id}`;
			const o = {
				...obj,
				scope: port.channelIds.map((channelID) => `${platform}:${channelID ?? "X"}`).join(","),
				user_id: user_id,
				platform_id: cid,
			};
			ctx.db.entitlements.put(o).catch(() => ctx.db.entitlements.update(o.id, o));

			// Send the entitlement to the client
			port.postMessage("ENTITLEMENT_CREATED", {
				id: obj.id,
				kind: obj.kind,
				ref_id: obj.ref_id,
				user_id: user_id,
				platform_id: cid,
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
				const id = `${cid}:${obj.kind}:${obj.ref_id}`;
				// Write to IDB
				ctx.db.entitlements.delete(id);

				// Send the entitlement to the client
				port.postMessage("ENTITLEMENT_DELETED", {
					id: id,
					kind: obj.kind,
					ref_id: obj.ref_id,
					user_id: obj.user!.id,
					platform_id: cid,
				});
			});
	}
}

export async function onEntitlementReset(ctx: EventContext, obj: Pick<SevenTV.User, "id">) {
	for (const port of ctx.driver.ports.values()) {
		const platform = port.platform;
		if (!platform) return; // no platform set

		const o: typeof obj = structuredClone(obj);
		if (!o.id) return;

		port.postMessage("ENTITLEMENT_RESET", {
			id: o.id,
		});

		ctx.db.entitlements.filter((e) => e.user_id === o.id).delete();
	}
}
