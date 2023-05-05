import { twitchBadgeFragment, twitchSubProductFragment } from "./tw.fragment.gql";
import { TwTypeMessage, TwTypeUser } from "./tw.gql";
import gql from "graphql-tag";

export const twitchUserCardQuery = gql`
	query ViewerCard(
		$channelID: ID
		$channelLogin: String!
		$hasChannelID: Boolean!
		$targetLogin: String!
		$isViewerBadgeCollectionEnabled: Boolean!
	) {
		activeTargetUser: user(login: $targetLogin) {
			id
		}
		targetUser: user(login: $targetLogin, lookupType: ALL) {
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
			stream {
				id
				game {
					id
					displayName
				}
				viewersCount
			}
		}
		channelUser: user(login: $channelLogin) {
			id
			login
			displayName
			subscriptionProducts {
				...subProduct
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
		channelViewer(userLogin: $targetLogin, channelLogin: $channelLogin) {
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

	${twitchSubProductFragment}
	${twitchBadgeFragment}
`;

export namespace twitchUserCardQuery {
	export interface Variables {
		channelID: string;
		channelLogin: string;
		hasChannelID: boolean;
		targetLogin: string;
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
		channel: Pick<TwTypeUser, "id" | "moderationSettings">;
	}
}

export const twitchUserCardModLogsQuery = gql`
	query ViewerCardModLogs($channelLogin: String!, $targetID: ID!) {
		targetUser: user(id: $targetID) {
			id
			login
		}
		channelUser: user(login: $channelLogin) {
			id
			login
			modLogs {
				...modLogs
			}
		}
		currentUser {
			login
			id
		}
	}

	fragment modLogs on ModLogs {
		messages: messagesBySender(
			senderID: $targetID
			first: 1
			includeMessageCount: true
			includeTargetedActions: true
			includeAutoModCaughtMessages: true
		) {
			messageCount
		}
		bans: targetedModActions(targetID: $targetID, actionType: BAN_USER) {
			edges {
				cursor
				node {
					...targetedModAction
				}
			}
			actionCount
			pageInfo {
				hasNextPage
				hasPreviousPage
			}
		}
		timeouts: targetedModActions(targetID: $targetID, actionType: TIMEOUT_USER) {
			edges {
				cursor
				node {
					...targetedModAction
				}
			}
			actionCount
			pageInfo {
				hasNextPage
				hasPreviousPage
			}
		}
		comments(targetID: $targetID) {
			edges {
				cursor
				node {
					id
				}
			}
		}
	}

	fragment targetedModAction on ModLogsTargetedModActionsEntry {
		id
		action
		timestamp
		channel {
			id
			login
		}
		target {
			id
			login
		}
		user {
			id
			login
		}
		details {
			...targetedModActionDetails
		}
	}

	fragment targetedModActionDetails on TargetedModActionDetails {
		bannedAt
		durationSeconds
		expiresAt
		reason
	}
`;

export namespace twitchUserCardModLogsQuery {
	export interface Variables {
		channelLogin: string;
		targetID: string;
	}

	export interface Response {
		targetUser: {
			id: string;
			login: string;
		};
		channelUser: {
			id: string;
			login: string;
			modLogs: {
				messages: {
					messageCount: number;
				};
				bans: {
					edges: {
						cursor: string;
						node: {
							id: string;
							actionType: string;
							createdAt: string;
							durationSeconds: number;
							reason: string;
							creator: {
								id: string;
								login: string;
								displayName: string;
								profileImageURL: string;
							};
						};
					}[];
					actionCount: number;
					pageInfo: {
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
				};
				timeouts: {
					edges: {
						cursor: string;
						node: {
							id: string;
							actionType: string;
							createdAt: string;
							durationSeconds: number;
							reason: string;
							creator: {
								id: string;
								login: string;
								displayName: string;
								profileImageURL: string;
							};
						};
					}[];
					actionCount: number;
					pageInfo: {
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
				};
				comments: {
					edges: {
						cursor: string;
						node: {
							id: string;
						};
					}[];
				};
			};
		};
		currentUser: {
			login: string;
			id: string;
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
							...modLogsMessageFields
							...autoModCaughtMessage
							...targetedModAction
						}
					}
					pageInfo {
						hasNextPage
					}
				}
			}
		}
	}

	fragment modLogsMessageFields on ModLogsMessage {
		id
		sentAt
		sender {
			...sender
		}
		content {
			text
		}
	}

	fragment autoModCaughtMessage on AutoModCaughtMessage {
		id
		category
		modLogsMessage {
			id
			sentAt
			content {
				text
			}
			sender {
				...sender
			}
		}
		resolvedAt
		resolver {
			...sender
		}
		status
	}

	fragment targetedModAction on ModLogsTargetedModActionsEntry {
		id
		action
		timestamp
		channel {
			id
			login
		}
		target {
			id
			login
		}
		user {
			id
			login
		}
		details {
			...targetedModActionDetails
		}
	}

	fragment targetedModActionDetails on TargetedModActionDetails {
		bannedAt
		durationSeconds
		expiresAt
		reason
	}

	fragment sender on User {
		id
		login
		displayName
		chatColor
		displayBadges {
			...badge
		}
	}

	${twitchBadgeFragment}
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
