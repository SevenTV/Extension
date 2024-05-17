import { computed, reactive } from "vue";
import { Logger } from "@/common/Logger";
import { changeEmoteInSetMutation } from "@/assets/gql/seventv.user.gql";
import { useChannelContext } from "./channel/useChannelContext";
import { useChatEmotes } from "./chat/useChatEmotes";
import { useActor } from "./useActor";
import { useMutation } from "@vue/apollo-composable";

const log = Logger.Get();
export function useSetMutation(setID?: string) {
	const mutateEmoteInSet = useMutation(changeEmoteInSetMutation, { errorPolicy: "all" });

	const ctx = useChannelContext();
	const emotes = useChatEmotes(ctx);
	const actor = useActor();

	if (!setID) {
		setID = computed(() => ctx.user?.connections?.find((s) => s.platform === ctx.platform)?.emote_set?.id).value;
	}

	const set = computed(() => (setID ? emotes.sets[setID] : undefined));

	const canEditSet = computed(() => {
		if (!actor.user) return false;
		if (ctx.id == actor.platformUserID) return true;
		return (ctx.user?.editors ?? []).some((e) => e.id == actor.user?.id);
	});

	async function add(emoteID: string) {
		if (!setID) {
			log.error("No set ID found");
			return;
		}
		const result = await mutateEmoteInSet.mutate({
			action: "ADD",
			emote_id: emoteID,
			id: setID,
		});
		if (result?.errors?.length) {
			throw new Error(result.errors[0].message);
		}
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
			throw new Error(result.errors[0].message);
		}
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
			throw new Error(result.errors[0].message);
		}
	}

	return reactive({ add, remove, rename, set, setID, canEditSet });
}
