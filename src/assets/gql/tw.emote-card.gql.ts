import { twitchSubProductOfferFragment, twitchSubProductsFragments } from "./tw.fragment.gql";
import { TwTypeEmote } from "./tw.gql";
import { gql } from "graphql-tag";

export const emoteCardQuery = gql`
	query EmoteCard($emoteID: ID!, $artistEnabled: Boolean!) {
		emote(id: $emoteID) {
			id
			type
			subscriptionTier
			token
			setID
			artist @include(if: $artistEnabled) {
				id
				login
				displayName
				profileImageURL(width: 70)
			}
			owner {
				id
				login
				displayName
				profileImageURL(width: 70)
				channel {
					id
					localEmoteSets {
						id
						emotes {
							id
							token
						}
					}
				}
				stream {
					id
					type
				}
				self {
					follower {
						followedAt
					}
					subscriptionBenefit {
						id
						tier
					}
				}
				subscriptionProducts {
					id
					displayName
					tier
					name
					url
					offers {
						...subProductOfferFragment
					}
					emotes {
						id
						token
					}
				}
			}
			subscriptionSummaries {
				...subSummary
			}
			bitsBadgeTierSummary {
				threshold
				self {
					isUnlocked
					numberOfBitsUntilUnlock
				}
			}
			type
		}
	}

	${twitchSubProductOfferFragment}
	${twitchSubProductsFragments}
`;

export namespace emoteCardQuery {
	export interface Result {
		emote: TwTypeEmote;
	}

	export interface Variables {
		emoteID: string;
		artistEnabled: boolean;
	}
}
