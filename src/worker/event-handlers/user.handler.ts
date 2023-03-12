import { log } from "@/common/Logger";
import { iterateChangeMap } from "./handler";
import { ChangeField, ChangeMap, EventContext, TypedWorkerMessage } from "..";

export async function onUserUpdate(ctx: EventContext, cm: ChangeMap<SevenTV.ObjectKind.USER>) {
	const emission = [] as TypedWorkerMessage<"USER_UPDATED">[];

	await iterateChangeMap<SevenTV.ObjectKind.USER>(cm, {
		connections: {
			async updated(fields: ChangeField[], _, cur?: ChangeField) {
				if (!cur) return;

				for (const f of fields) {
					switch (f.key) {
						case "emote_set": {
							const [oldSet, newSet] = [f.old_value, f.value] as SevenTV.EmoteSet[];

							// fetch the new set's emotes
							if (newSet) {
								const set = await ctx.driver.http
									.API()
									.seventv.loadEmoteSet(newSet.id)
									.catch((err) =>
										log.warn(
											"<Net/EventAPI>",
											`failed to fetch emote set (id: '${newSet.id}') during user connection update`,
											err,
										),
									);
								if (!set) return;

								newSet.emotes = set.emotes;
								ctx.db.emoteSets.put(set);
							}

							emission.push({
								id: cm.id,
								actor: cm.actor,
								emote_set: {
									connection_index: cur.index ?? 0,
									old_set: oldSet,
									new_set: newSet,
								},
							});

							break;
						}
					}
				}
			},
		},
	});

	for (const e of emission) {
		for (const port of ctx.driver.ports.values()) {
			port.postMessage("USER_UPDATED", e);
		}
	}
}
