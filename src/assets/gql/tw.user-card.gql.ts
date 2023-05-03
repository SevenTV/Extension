import { twitchMessageFragments, twitchSubProductsFragments } from "./tw.fragment.gql";
import { TwTypeMessage, TwTypeUser } from "./tw.gql";
import gql from "graphql-tag";

export const twitchUserCardQuery = gql`
	query ViewerCard(
		$channelID: ID
		$channelLogin: String!
		$hasChannelID: Boolean!
		$giftRecipientLogin: String!
		$isViewerBadgeCollectionEnabled: Boolean!
		$withStandardGifting: Boolean!
	) {
		activeTargetUser: user(login: $giftRecipientLogin) {
			id
		}
		targetUser: user(login: $giftRecipientLogin, lookupType: ALL) {
			id
			login
			bannerImageURL
			displayName
			displayBadges(channelID: $channelID) {
				...badge
				description
			}
			profileImageURL(width: 70)
			createdAt
			relationship(targetUserID: $channelID) @include(if: $hasChannelID) {
				cumulativeTenure: subscriptionTenure(tenureMethod: CUMULATIVE) {
					months
					daysRemaining
				}
				followedAt
				subscriptionBenefit {
					id
					tier
					purchasedWithPrime
					gift {
						isGift
					}
				}
			}
		}
		channelUser: user(login: $channelLogin) {
			id
			login
			displayName
			subscriptionProducts {
				...subscriptionProduct
			}
			self {
				banStatus {
					isPermanent
				}
				isModerator
			}
		}
		currentUser {
			login
			id
			roles {
				isSiteAdmin
				isStaff
				isGlobalMod
			}
			blockedUsers {
				id
			}
		}
		channelViewer(userLogin: $giftRecipientLogin, channelLogin: $channelLogin) {
			id
			earnedBadges @include(if: $isViewerBadgeCollectionEnabled) {
				...badge
				description
			}
		}
		channel(id: $channelID) {
			id
			moderationSettings {
				canAccessViewerCardModLogs
			}
		}
	}

	${twitchSubProductsFragments}
	${twitchMessageFragments}
`;

export namespace twitchUserCardQuery {
	export interface Variables {
		channelID: string;
		channelLogin: string;
		hasChannelID: boolean;
		giftRecipientLogin: string;
		isViewerBadgeCollectionEnabled: boolean;
		withStandardGifting: boolean;
	}

	export interface Response {
		activeTargetUser: Pick<TwTypeUser, "id">;
		targetUser: TwTypeUser;
		channelUser: Pick<TwTypeUser, "id" | "login" | "displayName"> & {
			subscriptionProducts: {
				id: string;
				displayName: string;
				tier: string;
				name: string;
				url: string;
				emotes: {
					id: string;
					token: string;
				}[];
				priceInfo: {
					id: string;
					currency: string;
					price: number;
				};
			}[];
			self: {
				banStatus: {
					isPermanent: boolean;
				};
				isModerator: boolean;
			};
		};
		currentUser: {
			login: string;
			id: string;
			roles: {
				isSiteAdmin: boolean;
				isStaff: boolean;
				isGlobalMod: boolean;
			};
			blockedUsers: {
				id: string;
			}[];
		};
		channelViewer: {
			id: string;
			earnedBadges: {
				id: string;
				displayName: string;
				description: string;
				imageURL: string;
				version: string;
			}[];
		};
		channel: {
			id: string;
			moderationSettings: {
				canAccessViewerCardModLogs: boolean;
			};
		};
	}
}

export const twitchUserCardMessagesQuery = gql`
	query UserCardMessagesBySender($senderID: ID!, $channelLogin: String!, $cursor: Cursor) {
		channel: user(login: $channelLogin) {
			id
			logs: modLogs {
				bySender: messagesBySender(
					senderID: $senderID
					first: 50
					order: DESC
					includeMessageCount: false
					includeTargetedActions: true
					includeAutoModCaughtMessages: true
					after: $cursor
				) {
					edges {
						cursor
						node {
							id
							sentAt
							sender {
								...messageSender
							}
							text
						}
					}
					pageInfo {
						hasNextPage
					}
				}
			}
		}
	}

	${twitchMessageFragments}
`;

export namespace twitchUserCardMessagesQuery {
	export interface Variables {
		senderID: string;
		channelLogin: string;
		cursor?: string;
	}

	export interface Response {
		channel: {
			id: string;
			logs: {
				bySender: {
					edges: {
						cursor: string;
						node: TwTypeMessage;
					}[];
					pageInfo: {
						hasNextPage: boolean;
					};
				};
			};
		};
	}
}
