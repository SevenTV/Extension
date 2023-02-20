import { reactive, toRaw } from "vue";
import { actorQuery } from "@/assets/gql/seventv.user.gql";
import { useLazyQuery } from "@vue/apollo-composable";

class ActorContext {
	user: SevenTV.User | null = null;
	query: ReturnType<typeof useLazyQuery<actorQuery.Result>> | null = null;

	openAuthorizeWindow(platform: Platform): void {
		if (this.user) return;

		const w = window.open(
			import.meta.env.VITE_APP_API + `/auth?platform=${platform}`,
			"7TV Auth",
			"width=500,height=600",
		);
		if (!w) return;

		const interval = setInterval(() => {
			if (!w.closed) return;

			this.query?.refetch();
			clearInterval(interval);
		}, 100);
	}

	logout(): void {
		fetch(import.meta.env.VITE_APP_API + "/auth/logout", {
			method: "POST",
			credentials: "include",
		}).then((res) => {
			if (!res.ok) return;

			this.user = null;
		});
	}
}

let ctx: ActorContext;
export function useActor(): ActorContext {
	if (!ctx) {
		ctx = reactive(new ActorContext()) as ActorContext;

		ctx.query = useLazyQuery<actorQuery.Result>(actorQuery, {}, {});
		ctx.query.onResult((res) => {
			if (!res?.data?.user) return;

			ctx.user = structuredClone(toRaw(res.data.user));
		});

		ctx.query.load();
	}

	return ctx;
}
