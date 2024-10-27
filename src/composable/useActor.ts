import { InjectionKey, inject, nextTick, provide, reactive, toRaw, watch } from "vue";
import { useConfig } from "@/composable/useSettings";
import { userByConnectionQuery, userQuery } from "@/assets/gql/seventv.user.gql";
import { SubscriptionResponse, useEgVault } from "@/app/store/egvault";
import { useLazyQuery } from "@vue/apollo-composable";

const ACTOR_KEY: InjectionKey<ActorContext> = Symbol("ActorContext");

class ActorContext {
	user: SevenTV.User | null = null;
	sub: SubscriptionResponse | null = null;
	token = useConfig<string>("app.7tv.token") as unknown as string;
	editAnySet = false;

	platform: Platform | null = null;
	platformUserID: string | null = null;

	query: ReturnType<typeof useLazyQuery<userQuery.Result>> | null = null;

	setPlatformUserID(platform: Platform, id: string): void {
		this.platform = platform;
		this.platformUserID = id;
	}

	logout(): void {
		nextTick(() => {
			this.token = "";
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
