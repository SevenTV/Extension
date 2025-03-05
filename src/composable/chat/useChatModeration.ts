import { twitchBanUserQuery, twitchUnbanUserQuery } from "@/assets/gql/tw.chat-bans.gql";
import { twitchDeleteMessageQuery } from "@/assets/gql/tw.chat-delete.gql";
import { twitchPinMessageQuery } from "@/assets/gql/tw.chat-pin.gql";
import { ModOrUnmodUser, twitchModUserMut, twitchUnmodUserMut } from "@/assets/gql/tw.mod-user.gql";
import { ChannelContext } from "../channel/useChannelContext";
import { useApollo } from "../useApollo";

export function useChatModeration(ctx: ChannelContext, victim: string) {
	const apollo = useApollo();

	/**
	 * Ban the user from the chat room
	 *
	 * @param channelID the ID of channel where to ban this usert
	 * @param victim the login of the user to ban
	 * @param expiresIn the duration of the ban, in seconds (null for permanent)
	 * @param reason the reason for the ban
	 */
	function banUserFromChat(expiresIn: string | null, reason?: string) {
		if (!apollo.value) return Promise.reject("Missing Apollo");

		return apollo.value.mutate<twitchBanUserQuery.Result, twitchBanUserQuery.Variables>({
			mutation: twitchBanUserQuery,
			variables: {
				input: {
					channelID: ctx.id,
					bannedUserLogin: victim,
					expiresIn,
					reason,
				},
			},
		});
	}

	/**
	 * Unban the user from the chat room
	 *
	 * @param channelID the ID of channel where to unban this user
	 * @param victim the login of the user to unban
	 */
	function unbanUserFromChat() {
		if (!apollo.value) return Promise.reject("Missing Apollo");

		return apollo.value.mutate({
			mutation: twitchUnbanUserQuery,
			variables: {
				input: {
					channelID: ctx.id,
					bannedUserLogin: victim,
				},
			},
		});
	}

	function pinChatMessage(msgID: string, duration: number) {
		if (!apollo.value) return Promise.reject("Missing Apollo");

		return apollo.value.mutate<twitchPinMessageQuery.Result, twitchPinMessageQuery.Variables>({
			mutation: twitchPinMessageQuery,
			variables: {
				input: {
					channelID: ctx.id,
					messageID: msgID,
					durationSeconds: duration,
					type: "MOD",
				},
			},
		});
	}

	function setUserModerator(victimID: string, mod: boolean) {
		if (!apollo.value) return Promise.reject("Missing Apollo");

		return apollo.value.mutate<ModOrUnmodUser.Response, ModOrUnmodUser.Variables>({
			mutation: !mod ? twitchModUserMut : twitchUnmodUserMut,
			variables: {
				input: {
					channelID: ctx.id,
					targetID: victimID,
				},
			},
		});
	}

	function deleteChatMessage(msgID: string) {
		if (!apollo.value) return Promise.reject("Missing Apollo");

		return apollo.value.mutate<twitchDeleteMessageQuery.Result, twitchDeleteMessageQuery.Variables>({
			mutation: twitchDeleteMessageQuery,
			variables: {
				input: {
					channelID: ctx.id,
					messageID: msgID,
				},
			},
		});
	}

	return {
		banUserFromChat,
		unbanUserFromChat,
		pinChatMessage,
		deleteChatMessage,
		setUserModerator,
	};
}
