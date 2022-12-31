import { log } from "@/common/Logger";
import type { ChangeMap, EventContext } from "@/worker/events";
import { iterateChangeMap } from "./handler";

export function onEmoteSetUpdate(ctx: EventContext, cm: ChangeMap<SevenTV.ObjectKind.EMOTE_SET>) {
	iterateChangeMap<SevenTV.ObjectKind.EMOTE_SET>(cm, {
		emotes: {
			pushed: (v: SevenTV.ActiveEmote) => {
				log.debug("Net/EventAPI", "EmoteSet/Emotes Push", v.name);

				ctx.db.emoteSets
					.where("id")
					.equals(cm.id)
					.modify((es) => {
						es.emotes.push(v);
					});
			},
			pulled: (_: SevenTV.ActiveEmote, old: SevenTV.ActiveEmote) => {
				log.debug("Net/EventAPI", "EmoteSet/Emotes Pull", old.name);

				ctx.db.emoteSets
					.where("id")
					.equals(cm.id)
					.modify((es) => {
						const i = es.emotes.findIndex((ae) => ae.id === old.id) ?? -1;

						if (i >= 0) es.emotes.splice(i, 1);
					});
			},
		},
	});
}
