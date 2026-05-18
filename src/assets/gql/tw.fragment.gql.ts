import gql from "graphql-tag";

export const twitchBadgeFragment = gql`
	fragment badge on Badge {
		id
		setID
		version
		title
		image1x: imageURL(size: NORMAL)
		image2x: imageURL(size: DOUBLE)
		image4x: imageURL(size: QUADRUPLE)
		clickAction
		clickURL
	}
`;

export const twitchMessageSenderFragment = gql`
	fragment messageSender on User {
		id
		login
		chatColor
		displayName
		displayBadges(channelID: $channelID) {
			...badge
		}
		__typename
	}

	${twitchBadgeFragment}
`;

export const twitchMessageFragments = gql`
	fragment messageFields on Message {
		id
		deletedAt
		sentAt
		content {
			...messageContent
		}
		sender {
			...messageSender
		}
		__typename
	}

	fragment messageContent on MessageContent {
		text
		fragments {
			...messageParticle
		}
		__typename
	}
	fragment messageParticle on MessageFragment {
		text
		content {
			... on CheermoteToken {
				...cheermoteFragment
			}
			... on Emote {
				...emoteFragment
			}
			... on User {
				...mentionFragment
			}
			... on AutoMod {
				...automodFragment
			}
			__typename
		}
		__typename
	}
	fragment cheermoteFragment on CheermoteToken {
		bitsAmount
		prefix
		tier
		__typename
	}
	fragment emoteFragment on Emote {
		emoteID: id
		setID
		token
		__typename
	}
	fragment mentionFragment on User {
		id
		login
		displayName
		__typename
	}
	fragment automodFragment on AutoMod {
		topics {
			type
			weight
			__typename
		}
		__typename
	}

	${twitchMessageSenderFragment}
	${twitchBadgeFragment}
`;

export const twitchSubProductsFragments = gql`
	fragment subSummary on SubscriptionSummary {
		id
		name
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
`;

export const twitchSubProductOfferFragment = gql`
	fragment subProductOfferFragment on Offer {
		id
		tplr
		platform
		eligibility {
			benefitsStartAt
			isEligible
		}
		tagBindings {
			key
			value
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
						renewalPolicy
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
			eligibilityFilters {
				value
			}
			priority
			promoType
			endAt
		}
		quantity {
			min
			max
		}
	}
`;

export const twitchSubProductOfferWithPromotionsFragment = gql`
	fragment subProductOfferWithPromotions on Offer {
		id
		tplr
		platform
		eligibility {
			benefitsStartAt
			isEligible
		}
		tagBindings {
			key
			value
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
						renewalPolicy
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
			eligibilityFilters {
				value
			}
			priority
			promoType
			endAt
		}
		promotions {
			id
			name
			promoDisplay {
				discountPercent
				discountType
			}
			eligibilityFilters {
				value
			}
			priority
			promoType
			endAt
			quantity {
				min
				max
			}
		}
		quantity {
			min
			max
		}
	}
`;

export const twitchSubscriptionProductFragment = gql`
	fragment subscriptionProduct on SubscriptionProduct {
		id
		price
		url
		emoteSetID
		displayName
		name
		tier
		type
		hasAdFree
		emotes {
			...subscriptionProductEmote
		}
		emoteModifiers {
			...subscriptionProductEmoteModifier
		}
		interval {
			unit
		}
		self {
			canGiftInChannel
		}
		offers {
			...subProductOfferFragment
		}
		gifting {
			...subStandardGiftingFragment
			...subCommunityGiftingFragment
		}
	}

	fragment subscriptionProductEmote on Emote {
		id
		setID
		token
		assetType
	}

	fragment subscriptionProductEmoteModifier on EmoteModifier {
		code
		name
	}

	fragment subStandardGiftingFragment on SubscriptionGifting {
		standard(recipientLogin: $giftRecipientLogin) @include(if: $withStandardGifting) {
			offer {
				...subProductOfferFragment
			}
		}
	}

	fragment subCommunityGiftingFragment on SubscriptionGifting {
		community {
			offer {
				...subProductOfferWithPromotions
			}
		}
	}

	${twitchSubProductOfferFragment}
	${twitchSubProductOfferWithPromotionsFragment}
`;

export const twitchModCommentFragment = gql`
	fragment modComment on ModLogsComment {
		id
		timestamp
		text
		author {
			...modCommentUser
		}
		channel {
			...modCommentUser
		}
		target {
			...modCommentUser
		}
	}

	fragment modCommentUser on User {
		id
		login
		displayName
		chatColor
	}
`;
