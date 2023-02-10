import { TwTypeEmote } from "./tw.gql";
import { gql } from "graphql-tag";

export const emoteCardQuery = gql`
	query EmoteCard($emoteID: ID!, $octaneEnabled: Boolean!, $artistEnabled: Boolean!) {
		emote(id: $emoteID) {
			id
			type
			subscriptionTier @include(if: $octaneEnabled)
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
					emotes {
						id
						token
					}
					priceInfo {
						id
						currency
						price
					}
				}
			}
			subscriptionProduct @skip(if: $octaneEnabled) {
				...subProduct
			}
			subscriptionSummaries @include(if: $octaneEnabled) {
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
	fragment subSummary on SubscriptionSummary {
		id
		name
		offers {
			id
			currency
			exponent
			price
			promoDescription
		}
		emotes {
			id
			token
			subscriptionTier
		}
		url
		tier
		modifiers {
			code
			name
			subscriptionTier
		}
		self {
			subscribedTier
			cumulativeTenure
		}
	}
	fragment subProduct on SubscriptionProduct {
		id
		url
		price
		name
		tier
		interval {
			unit
		}
		state
		emotes {
			id
			setID
			token
		}
		offers {
			...subProductOfferFragment
		}
		emoteModifiers {
			...subscriptionProductEmoteModifier
		}
		self {
			cumulativeTenure: subscriptionTenure(tenureMethod: CUMULATIVE) {
				months
			}
			benefit {
				id
				tier
			}
		}
		owner {
			id
			displayName
			login
			subscriptionProducts {
				id
				tier
				url
				price
				emotes {
					id
					token
				}
				emoteModifiers {
					...subscriptionProductEmoteModifier
				}
			}
			stream {
				id
				type
			}
		}
	}
	fragment subProductOfferFragment on Offer {
		id
		tplr
		platform
		eligibility {
			benefitsStartAt
			isEligible
		}
		giftType
		listing {
			chargeModel {
				internal {
					previewPrice {
						id
						currency
						exponent
						price
						total
						discount {
							price
							total
						}
					}
					plan {
						interval {
							duration
							unit
						}
					}
				}
			}
		}
		promotion {
			id
			name
			promoDisplay {
				discountPercent
				discountType
			}
			priority
		}
		quantity {
			min
			max
		}
	}
	fragment subscriptionProductEmoteModifier on EmoteModifier {
		code
		name
	}
`;

export namespace emoteCardQuery {
	export interface Result {
		emote: TwTypeEmote;
	}

	export interface Variables {
		emoteID: string;
		octaneEnabled: boolean;
		artistEnabled: boolean;
	}
}
