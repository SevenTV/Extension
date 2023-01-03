import { iterateChangeMap } from "./handler";
import { ChangeMap, EventContext } from "..";

export function onEmoteSetUpdate(ctx: EventContext, cm: ChangeMap<SevenTV.ObjectKind.EMOTE_SET>) {
	iterateChangeMap<SevenTV.ObjectKind.EMOTE_SET>(cm, {
		emotes: {
			pushed: (v: SevenTV.ActiveEmote) => {
				ctx.db.emoteSets
					.where("id")
					.equals(cm.id)
					.modify((es) => {
						es.emotes.push(v);
					});
			},
			pulled: (_: SevenTV.ActiveEmote, old: SevenTV.ActiveEmote) => {
				ctx.db.emoteSets
					.where("id")
					.equals(cm.id)
					.modify((es) => {
						for (;;) {
							const i = es.emotes.findIndex((ae) => ae.id === old.id);
							if (i < 0) break;

							es.emotes.splice(i, 1);
						}
					});
			},
		},
	});
}
