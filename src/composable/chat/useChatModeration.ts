import { twitchBanUserQuery, twitchUnbanUserQuery } from "@/assets/gql/tw.chat-bans.gql";
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
		if (!apollo) return null;

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
		if (!apollo) return null;

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

	function deleteChatMessage(msgID: string) {
		messages.sendMessage(`/delete ${msgID}`);
	}

	return {
		banUserFromChat,
		unbanUserFromChat,
		deleteChatMessage,
	};
}
