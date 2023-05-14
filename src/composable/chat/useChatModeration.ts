import { twitchBanUserQuery, twitchUnbanUserQuery } from "@/assets/gql/tw.chat-bans.gql";
import { twitchPinMessageQuery } from "@/assets/gql/tw.chat-pin.gql";
import { ModOrUnmodUser, twitchModUserMut, twitchUnmodUserMut } from "@/assets/gql/tw.mod-user.gql";
import { useChatMessages } from "./useChatMessages";
import { ChannelContext } from "../channel/useChannelContext";
import { useApollo } from "../useApollo";

export function useChatModeration(ctx: ChannelContext, victim: string) {
	const messages = useChatMessages(ctx);

	/**
	 * Ban the user from the chat room
	 *
	 * @param channelID the ID of channel where to ban this usert
	 * @param victim the login of the user to ban
	 * @param expiresIn the duration of the ban, in seconds (null for permanent)
	 * @param reason the reason for the ban
	 */
	function banUserFromChat(expiresIn: string | null, reason?: string) {
		const apollo = useApollo();
		if (!apollo) return Promise.reject("Missing Apollo");

		return apollo.mutate<twitchBanUserQuery.Result, twitchBanUserQuery.Variables>({
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
		const apollo = useApollo();
		if (!apollo) return Promise.reject("Missing Apollo");

		return apollo.mutate({
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
		const apollo = useApollo();
		if (!apollo) return Promise.reject("Missing Apollo");

		return apollo.mutate<twitchPinMessageQuery.Result, twitchPinMessageQuery.Variables>({
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
		const apollo = useApollo();
		if (!apollo) return Promise.reject("Missing Apollo");

		return apollo.mutate<ModOrUnmodUser.Response, ModOrUnmodUser.Variables>({
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
		messages.sendMessage(`/delete ${msgID}`);
	}

	return {
		banUserFromChat,
		unbanUserFromChat,
		pinChatMessage,
		deleteChatMessage,
		setUserModerator,
	};
}
