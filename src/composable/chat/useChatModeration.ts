import { twitchBanUserQuery, twitchUnbanUserQuery } from "@/assets/gql/tw.chat-bans.gql";
import { useChatMessages } from "./useChatMessages";
import { useApollo } from "../useApollo";

function deleteChatMessage(msgID: string) {
	const { sendMessage } = useChatMessages();
	if (!sendMessage) return;

	sendMessage(`/delete ${msgID}`);
}

export function useChatModeration(channelID: string, victim: string) {
	/**
	 * Ban the user from the chat room
	 *
	 * @param channelID the ID of channel where to ban this usert
	 * @param victim the login of the user to ban
	 * @param expiresIn the duration of the ban, in seconds (null for timeout)
	 * @param reason the reason for the ban
	 */
	function banUserFromChat(expiresIn: string | null, reason?: string) {
		const apollo = useApollo();
		if (!apollo) return null;

		return apollo.mutate({
			mutation: twitchBanUserQuery,
			variables: {
				input: {
					channelID,
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
					channelID,
					bannedUserLogin: victim,
				},
			},
		});
	}

	return {
		banUserFromChat,
		unbanUserFromChat,
		deleteChatMessage,
	};
}
