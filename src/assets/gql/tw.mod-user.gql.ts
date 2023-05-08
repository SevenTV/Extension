import { TwTypeUser } from "./tw.gql";
import gql from "graphql-tag";

export const twitchModUserMut = gql`
	mutation ModUser($input: ModUserInput!) {
		result: modUser(input: $input) {
			channel {
				id
				login
			}
			target {
				id
				login
			}
			error {
				code
			}
		}
	}
`;

export const twitchUnmodUserMut = gql`
	mutation UnmodUser($input: ModUserInput!) {
		result: modUser(input: $input) {
			channel {
				id
				login
			}
			target {
				id
				login
			}
			error {
				code
			}
		}
	}
`;

export namespace ModOrUnmodUser {
	export interface Variables {
		input: {
			channelID: string;
			targetID?: string;
			targetLogin?: string;
		};
	}

	export interface Response {
		result: {
			channel: Pick<TwTypeUser, "id" | "login">;
			target: Pick<TwTypeUser, "id" | "login">;
			error: {
				code:
					| "FORBIDDEN"
					| "TARGET_NOT_FOUND"
					| "CHANNEL_NOT_FOUND"
					| "TARGET_NOT_MOD"
					| "TARGET_ALREADY_MOD"
					| "TARGET_IS_CHAT_BANNED";
			};
		};
	}
}
