import { reactive } from "vue";
import { watchOnce } from "@vueuse/core";
import { actorQuery } from "@/assets/gql/seventv.user.gql";
import { useLazyQuery } from "@vue/apollo-composable";

class ActorContext {
	user: SevenTV.User | null = null;
}

const ctx: ActorContext = reactive(new ActorContext());

export function useActor(): ActorContext {
	const query = useLazyQuery<actorQuery.Result>(actorQuery, {}, {});

	if (!ctx.user) {
		query.load();

		watchOnce(query.result, (res) => {
			if (!res?.user) return;

			ctx.user = structuredClone(res.user);
		});
	}

	return ctx;
}
