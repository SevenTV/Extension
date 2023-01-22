import { imageHostToSrcset } from "@/common/Image";
import { log } from "@/common/Logger";
import { iterateChangeMap } from "./handler";
import { ChangeMap, EventContext, TypedWorkerMessage } from "..";
import { WorkerHttp } from "../worker.http";

export function onEmoteSetCreate(ctx: EventContext, cm: ChangeMap<SevenTV.ObjectKind.EMOTE_SET>) {
	if (!cm.object) return;

	const es = cm.object;
	if (!es.emotes) es.emotes = [];

	es.provider = "7TV";
	es.scope = es.flags & 4 ? "PERSONAL" : "CHANNEL";

	for (const ae of es.emotes) {
		if (!ae.data) continue;

		ae.data.host.srcset = imageHostToSrcset(ae.data.host, "7TV", WorkerHttp.imageFormat);
		ae.provider = es.provider;
		ae.scope = es.scope;
	}

	ctx.db.emoteSets.put(cm.object).catch((err) => log.error("<EventAPI>", "failed to insert emote set", err));
}

export async function onEmoteSetUpdate(ctx: EventContext, cm: ChangeMap<SevenTV.ObjectKind.EMOTE_SET>) {
	const emission = {
		id: cm.id,
		user: cm.actor,
		emotes_added: [] as SevenTV.ActiveEmote[],
		emotes_removed: [] as SevenTV.ActiveEmote[],
	} as TypedWorkerMessage<"EMOTE_SET_UPDATED">;

	await iterateChangeMap<SevenTV.ObjectKind.EMOTE_SET>(cm, {
		emotes: {
			pushed: async (v: SevenTV.ActiveEmote) => {
				return ctx.db.emoteSets
					.where("id")
					.equals(cm.id)
					.modify((es) => {
						if (v.data) {
							v.data.host.srcset = imageHostToSrcset(v.data.host, "7TV", WorkerHttp.imageFormat);
							v.provider = "7TV";
							if (!v.scope) v.scope = es.flags & 4 ? "PERSONAL" : "CHANNEL";
						}

						es.emotes.push(v);
						emission.emotes_added.push(v);
					})
					.then(() => void 0);
			},
			pulled: async (_: SevenTV.ActiveEmote, old: SevenTV.ActiveEmote) => {
				return ctx.db.emoteSets
					.where("id")
					.equals(cm.id)
					.modify((es) => {
						for (;;) {
							const i = es.emotes.findIndex((ae) => ae.id === old.id);
							if (i < 0) break;

							es.emotes.splice(i, 1);
							emission.emotes_removed.push(old);
						}
					})
					.then(() => void 0);
			},
		},
	});

	for (const port of ctx.driver.ports.values()) {
		port.postMessage("EMOTE_SET_UPDATED", emission);
	}
}
