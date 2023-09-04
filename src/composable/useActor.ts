import { InjectionKey, inject, provide, reactive, toRaw, watch } from "vue";
import { userByConnectionQuery, userQuery } from "@/assets/gql/seventv.user.gql";
import { SubscriptionResponse, useEgVault } from "@/app/store/egvault";
import { useLazyQuery } from "@vue/apollo-composable";

const ACTOR_KEY: InjectionKey<ActorContext> = Symbol("ActorContext");

class ActorContext {
	user: SevenTV.User | null = null;
	sub: SubscriptionResponse | null = null;

	platform: Platform | null = null;
	platformUserID: string | null = null;

	query: ReturnType<typeof useLazyQuery<userQuery.Result>> | null = null;

	setPlatformUserID(platform: Platform, id: string): void {
		this.platform = platform;
		this.platformUserID = id;
	}

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
		}).then(() => {
			// So the user can re-authenticate if needed
			this.user = null;
		});
	}
}

export function useActor(): ActorContext {
	const eg = useEgVault();

	let ctx = inject(ACTOR_KEY, null)!;
	if (!ctx) {
		ctx = reactive(new ActorContext()) as ActorContext;

		ctx.query = useLazyQuery<userQuery.Result>(userByConnectionQuery, {}, {});
		ctx.query.onResult((res) => {
			if (!res?.data?.user) return;

			ctx.user = structuredClone(toRaw(res.data.user));
		});

		provide(ACTOR_KEY, ctx);

		watch(
			() => ctx.platformUserID,
			(id) => {
				if (!id || !ctx.query) return;

				ctx.query.load(ctx.query.document.value, {
					id: ctx.platformUserID,
					platform: ctx.platform,
				});
			},
			{ immediate: true },
		);

		watch(
			() => ctx.user?.id,
			(userID) => {
				if (!userID) return;

				eg.fetchSub(userID)
					.then((sub) => {
						if (!sub || !sub.active) return;

						ctx.sub = sub;
					})
					.catch(() => void 0);
			},
		);
	}

	return ctx;
}
