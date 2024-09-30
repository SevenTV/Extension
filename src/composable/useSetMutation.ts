import { computed, reactive, watch } from "vue";
import { Logger } from "@/common/Logger";
import { changeEmoteInSetMutation } from "@/assets/gql/seventv.user.gql";
import { useChannelContext } from "./channel/useChannelContext";
import { useChatEmotes } from "./chat/useChatEmotes";
import { useActor } from "./useActor";
import { FetchResult } from "@apollo/client";
import { useMutation } from "@vue/apollo-composable";
import { GraphQLError } from "graphql";

type QueryPromise = Promise<FetchResult | undefined>;

export interface SetMutation {
	add(emoteID: string, alias?: string): QueryPromise;
	remove(emoteID: string): QueryPromise;
	rename(emoteID: string, name: string): QueryPromise;
	set?: SevenTV.EmoteSet;
	SetID?: string;
	canEditSet: boolean;
	needsLogin: boolean;
}

const log = Logger.Get();
export function useSetMutation(setID?: string): SetMutation {
	const mutateEmoteInSet = useMutation(changeEmoteInSetMutation, { errorPolicy: "all" });

	const ctx = useChannelContext();
	const emotes = useChatEmotes(ctx);
	const actor = useActor();

	if (!setID) {
		watch(
			() => ctx.user,
			(u) => {
				if (!u) return;
				setID = u.connections?.find((s) => s.platform === ctx.platform)?.emote_set?.id;
			},
			{ immediate: true },
		);
	}

	const set = computed(() => {
		if (!setID) return;
		if (!emotes.sets[setID]) return;
		return emotes.sets[setID];
	});

	const canEditIfLoggedIn = computed(() => {
		if (!actor.user) return false;
		if (ctx.id == actor.platformUserID) return true;
		if ((ctx.user?.editors ?? []).some((e) => e.id == actor.user?.id)) return true;
		return actor.editAnySet;
	});

	const canEditSet = computed(() => {
		if (!actor.token) return false;
		return canEditIfLoggedIn.value;
	});

	const needsLogin = computed(() => {
		return canEditIfLoggedIn.value && !actor.token;
	});

	async function add(emoteID: string, alias?: string) {
		if (!setID) {
			log.error("No set ID found");
			return;
		}
		const result = await mutateEmoteInSet.mutate({
			action: "ADD",
			emote_id: emoteID,
			id: setID,
			name: alias,
		});
		if (result?.errors?.length) {
			const e = result.errors[0];
			throw new GraphQLError(e.message, e);
		}
		return result as FetchResult;
	}

	async function remove(emoteID: string) {
		if (!setID) {
			log.error("No set ID found");
			return;
		}
		const result = await mutateEmoteInSet.mutate({
			action: "REMOVE",
			emote_id: emoteID,
			id: setID,
		});
		if (result?.errors?.length) {
			const e = result.errors[0];
			throw new GraphQLError(e.message, e);
		}
		return result as FetchResult;
	}

	async function rename(emoteID: string, name: string) {
		if (!setID) {
			log.error("No set ID found");
			return;
		}
		const result = await mutateEmoteInSet.mutate({
			action: "UPDATE",
			emote_id: emoteID,
			id: setID,
			name,
		});
		if (result?.errors?.length) {
			const e = result.errors[0];
			throw new GraphQLError(e.message, e);
		}
		return result as FetchResult;
	}

	return reactive({ add, remove, rename, set, setID, canEditSet, needsLogin });
}
