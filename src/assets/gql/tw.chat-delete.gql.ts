import gql from "graphql-tag";

export const twitchDeleteMessageQuery = gql`
	mutation Chat_DeleteChatMessage($input: DeleteChatMessageInput!) {
		deleteChatMessage(input: $input) {
			responseCode
			message {
				id
				sender {
					id
					login
					displayName
				}
				content {
					text
				}
			}
		}
	}
`;

export namespace twitchDeleteMessageQuery {
	export interface Variables {
		input: {
			channelID: string;
			messageID: string;
		};
	}
	export interface Result {
		id: string;
		sender: null | object;
		content: null | object;
	}
}
