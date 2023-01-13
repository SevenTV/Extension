import { ChangeMap, EventContext } from "..";
import type { WorkerPort } from "../worker.port";

export async function onEntitlementCreate(
	ctx: EventContext,
	cm: ChangeMap<SevenTV.ObjectKind.ENTITLEMENT>,
	ports: WorkerPort[],
) {
	if (!cm.object || !ports.length) return;

	for (const port of ports) {
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
				scope: `${platform}:${port.channel?.id ?? "X"}`,
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

export async function onEntitlementDelete(
	ctx: EventContext,
	cm: ChangeMap<SevenTV.ObjectKind.ENTITLEMENT>,
	ports: WorkerPort[],
) {
	if (!cm.object || !ports.length) return;

	for (const port of ports) {
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
