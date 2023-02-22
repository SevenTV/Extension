import gql from "graphql-tag";

export const twitchPinMessageQuery = gql`
	mutation PinChatMessage($input: PinChatMessageInput!) {
		pinChatMessage(input: $input) {
			pinnedChatMessage {
				id
				pinnedMessage {
					id
				}
			}
			error {
				code
			}
		}
	}
`;

export namespace twitchPinMessageQuery {
	export interface Variables {
		input: {
			channelID: string;
			messageID: string;
			durationSeconds: number;
			type: "MOD";
		};
	}
	export interface Result {
		id: string;
		pinnedChatMessage: null | object;
	}
}
