import { twitchBadgeFragment, twitchModCommentFragment, twitchSubProductFragment } from "./tw.fragment.gql";
import { TwTypeBadge, TwTypeChatBanStatus, TwTypeMessage, TwTypeModComment, TwTypeUser } from "./tw.gql";
import gql from "graphql-tag";

export const twitchUserCardQuery = gql`
	query ViewerCard(
		$channelID: ID!
		$channelIDStr: String!
		$channelLogin: String!
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
			chatColor
			profileImageURL(width: 70)
			createdAt
			relationship(targetUserID: $channelID) {
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
			isModerator(channelID: $channelIDStr)
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
		channelIDStr: string;
		channelLogin: string;
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
			blockedUsers: {
				id: string;
			}[];
		};
		channelViewer: {
			id: string;
			earnedBadges: TwTypeBadge[];
		};
		channel: Pick<TwTypeUser, "id" | "moderationSettings">;
	}
}

export const twitchUserCardModLogsQuery = gql`
	query ViewerCardModLogs($channelLogin: String!, $channelID: ID!, $targetID: ID!) {
		targetUser: user(id: $targetID) {
			id
			login
		}
		channelUser: user(login: $channelLogin) {
			id
			login
		}
		currentUser {
			login
			id
		}
		banStatus: chatRoomBanStatus(channelID: $channelID, userID: $targetID) {
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

		viewerCardModLogs(channelID: $channelID, targetID: $targetID) {
			messages: messages(first: 1000) {
				... on ViewerCardModLogsMessagesError {
					code
				}
				... on ViewerCardModLogsMessagesConnection {
					pageInfo {
						hasNextPage
					}
					count
				}
			}
			bans: targetedActions(first: 99, type: BAN) {
				...modLogsTargetedActionsResultFragment
			}
			timeouts: targetedActions(first: 99, type: TIMEOUT) {
				...modLogsTargetedActionsResultFragment
			}
			unbans: targetedActions(first: 99, type: UNBAN) {
				...modLogsTargetedActionsResultFragment
			}
			untimeouts: targetedActions(first: 99, type: UNTIMEOUT) {
				...modLogsTargetedActionsResultFragment
			}
			warnings: targetedActions(first: 99, type: WARNING) {
				...modLogsTargetedActionsResultFragment
			}
			comments(first: 100) {
				... on ModLogsCommentConnection {
					edges {
						cursor
						node {
							id
							timestamp
							text
							channel {
								id
							}
							author {
								id
								login
								displayName
								chatColor
							}
						}
					}
					pageInfo {
						hasNextPage
						hasPreviousPage
					}
				}
				... on ModLogsCommentsError {
					code
				}
				__typename
			}
		}
	}

	fragment modLogsTargetedActionsResultFragment on ModLogsTargetedActionsResult {
		__typename
		... on ModLogsTargetedActionsError {
			code
		}
		... on ModLogsTargetedActionsConnection {
			count
			pageInfo {
				hasNextPage
			}
			edges {
				cursor
				node {
					...modLogsTargetedActionFragment
				}
			}
		}
	}

	fragment modLogsTargetedActionFragment on ModLogsTargetedAction {
		id
		localizedLabel {
			fallbackString
			...modActionTokens
		}
		timestamp
		type
	}

	fragment modActionTokens on ModActionsLocalizedText {
		localizedStringFragments {
			...modActionText
		}
	}

	fragment modActionText on ModActionsLocalizedTextFragment {
		token {
			... on ModActionsLocalizedTextToken {
				text
			}
			... on User {
				displayName
				login
				id
			}
		}
	}
`;

export namespace twitchUserCardModLogsQuery {
	export interface Variables {
		channelID: string;
		channelLogin: string;
		targetID: string;
	}

	interface ModActionsLocalizedText {
		id: string;
		localizedLabel: {
			fallbackString: string;
			localizedStringFragments: {
				token: TwTypeUser | { text: string };
			}[];
		};
		timestamp: string;
		type: "BAN" | "WARNING" | "TIMEOUT" | "UNBAN" | "UNTIMEOUT";
	}

	interface ActionsConnection {
		edges: {
			cursor: string;
			node: ModActionsLocalizedText;
		}[];
		count: number;
		pageInfo: {
			hasNextPage: boolean;
			hasPreviousPage: boolean;
		};
	}

	export interface Response {
		targetUser: {
			id: string;
			login: string;
		};
		channelUser: {
			id: string;
			login: string;
		};
		currentUser: {
			login: string;
			id: string;
		};
		banStatus: TwTypeChatBanStatus;
		viewerCardModLogs: {
			comments: {
				edges: {
					cursor: string;
					node: TwTypeModComment;
				}[];
			};

			messages: {
				count: number;
			};
			bans: ActionsConnection;
			timeouts: ActionsConnection;
			warnings: ActionsConnection;
		};
	}
}

export const twitchUserCardMessagesQuery = gql`
	#import "twilight/features/message/fragments/message-sender/sender-fragment.gql"
	#import "twilight/features/moderation/moderation-actions/hooks/use-get-mod-actions/mod-action-tokens-fragment.gql"
	query ViewerCardModLogsMessagesBySender($channelID: ID!, $senderID: ID!, $cursor: Cursor) {
		logs: viewerCardModLogs(channelID: $channelID, targetID: $senderID) {
			messages(first: 50, after: $cursor) {
				... on ViewerCardModLogsMessagesError {
					code
				}
				... on ViewerCardModLogsMessagesConnection {
					edges {
						...viewerCardModLogsMessagesEdgeFragment
					}
					pageInfo {
						hasNextPage
					}
				}
			}
		}
	}
	fragment viewerCardModLogsMessagesEdgeFragment on ViewerCardModLogsMessagesEdge {
		__typename
		node {
			...viewerCardModLogsCaughtMessageFragment
			...viewerCardModLogsChatMessageFragment
			...viewerCardModLogsModActionsMessageFragment
		}
		cursor
	}
	fragment viewerCardModLogsChatMessageFragment on ViewerCardModLogsChatMessage {
		id
		sender {
			id
			login
			chatColor
			displayName
			displayBadges(channelID: $channelID) {
				id
				setID
				version
				__typename
			}
			__typename
		}
		sentAt
		content {
			text
			fragments {
				text
				content {
					... on Emote {
						emoteID: id
						setID
						token
					}
					#mention
					... on User {
						id
					}
					__typename
				}
			}
			__typename
		}
	}
	fragment viewerCardModLogsCaughtMessageFragment on ViewerCardModLogsCaughtMessage {
		id
		status
		category
		sentAt
		resolvedAt
		content {
			text
			fragments {
				text
				content {
					... on Emote {
						emoteID: id
						setID
						token
					}
					... on User {
						id
					}
					__typename
				}
			}
			__typename
		}
		sender {
			id
			login
			chatColor
			displayName
			displayBadges(channelID: $channelID) {
				id
				setID
				version
			}
			__typename
		}
		resolver {
			...sender
		}
		__typename
	}

	fragment viewerCardModLogsModActionsMessageFragment on ViewerCardModLogsModActionsMessage {
		timestamp
		content {
			fallbackString
			...modActionTokens
		}
	}

	fragment modActionTokens on ModActionsLocalizedText {
		localizedStringFragments {
			...modActionText
		}
	}

	fragment modActionText on ModActionsLocalizedTextFragment {
		token {
			... on ModActionsLocalizedTextToken {
				text
			}
			... on User {
				displayName
				login
				id
			}
		}
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
		channelID: string;
		cursor?: string;
	}

	export interface Response {
		logs: {
			id: string;
			messages: {
				edges: {
					cursor: string;
					node: TwTypeMessage;
				}[];
				pageInfo: {
					hasNextPage: boolean;
				};
			};
		};
	}
}

export const twitchUserCardCreateModCommentMut = gql`
	mutation createModComment($input: CreateModeratorCommentInput!) {
		createModeratorComment(input: $input) {
			comment {
				...modComment
			}
		}
	}

	${twitchModCommentFragment}
`;

export const twitchUserCardDeleteModCommentMut = gql`
	mutation deleteModeratorComment($input: DeleteModeratorCommentInput!) {
		deleteModeratorComment(input: $input) {
			comment {
				...modComment
			}
		}
	}

	${twitchModCommentFragment}
`;

export namespace twitchUserCardCreateModCommentMut {
	export interface Variables {
		input: {
			channelID: string;
			targetID: string;
			text: string;
		};
	}

	export interface Response {
		createModeratorComment: {
			comment: TwTypeModComment;
		};
	}
}

export namespace twitchUserCardDeleteModCommentMut {
	export interface Variables {
		input: {
			ID: string;
			channelID: string;
		};
	}

	export interface Response {
		deleteModeratorComment: {
			comment: TwTypeModComment;
		};
	}
}
