import { twitchMessageFragments } from "./tw.fragment.gql";
import gql from "graphql-tag";

export const twitchChatReplyQuery = gql`
	query ChatReplies($messageID: ID!, $channelID: ID!) {
		message(id: $messageID) {
			...messageFields
			replies {
				nodes {
					...messageFields
				}
				totalCount
			}
		}
	}

	${twitchMessageFragments}
`;
