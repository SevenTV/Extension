import { changeEmoteInSetMutation } from "@/assets/gql/seventv.user.gql";
import { useMutation } from "@vue/apollo-composable";

export function useSetMutation(setID: string) {
	const mutateEmoteInSet = useMutation(changeEmoteInSetMutation, { errorPolicy: "all" });
	async function add(emoteID: string) {
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

	return { add, remove, rename };
}
