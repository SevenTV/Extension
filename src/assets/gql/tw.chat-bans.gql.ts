import { TwTypeChatBanStatus } from "./tw.gql";
import gql from "graphql-tag";

export const twitchBanUserQuery = gql`
	mutation Chat_BanUserFromChatRoom($input: BanUserFromChatRoomInput!) {
		banUserFromChatRoom(input: $input) {
			ban {
				bannedUser {
					id
					login
					displayName
				}
				createdAt
				expiresAt
				isPermanent
				moderator {
					id
					login
					displayName
				}
				reason
			}
			error {
				code
				minTimeoutDurationSeconds
				maxTimeoutDurationSeconds
			}
		}
	}
`;

export namespace twitchBanUserQuery {
	export interface Variables {
		input: {
			channelID: string;
			bannedUserLogin: string;
			expiresIn: string | null;
			reason?: string;
		};
	}
	export interface Result {
		banUserFromChatRoom: {
			ban: null | TwTypeChatBanStatus;
			error: null | {
				code: string;
			};
		};
	}
}

export const twitchUnbanUserQuery = gql`
	mutation Chat_UnbanUserFromChatRoom($input: UnbanUserFromChatRoomInput!) {
		unbanUserFromChatRoom(input: $input) {
			ban {
				bannedUser {
					id
					login
					displayName
				}
				createdAt
				expiresAt
				isPermanent
				moderator {
					id
					login
					displayName
				}
			}
			error {
				code
			}
		}
	}
`;

export namespace twitchUnbanUserQuery {
	export interface Variables {
		input: {
			channelID: string;
			bannedUserLogin: string;
		};
	}
}
