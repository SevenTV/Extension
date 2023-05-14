export interface TwTypeEmote {
	id: string;
	type: "SUBSCRIPTIONS" | "GLOBALS";
	token: string;
	setID: string;
	artist: TwTypeUser | null;
	owner: TwTypeUser | null;
	bitsBadgeTierSummary: unknown;
	subscriptionSummaries: TwTypeSubscriptionSummary[];
	subscriptionTier: string | null;
}

export interface TwTypeUser {
	id: string;
	login: string;
	displayName: string;
	displayBadges: TwTypeBadge[];
	chatColor: string;
	profileImageURL: string;
	bannerImageURL?: string;
	channel: TwTypeChannel;
	self: TwTypeUserSelfConnection;
	blockedUsers: TwTypeUser[];
	moderationSettings: {
		canAccessViewerCardModLogs: boolean;
	};
	isModerator: boolean;
	relationship?: {
		followedAt: string;
		cumulativeTenure: null | string;
		subscriptionBenefits: null | string;
	};
	stream?: TwTypeStream;
}

export interface TwTypeStream {
	id: string;
	viewersCount: number;
	game?: {
		id: string;
		displayName: string;
	};
}

export interface TwTypeBadge {
	clickAction: string | null;
	clickURL: string | null;
	id: string;
	image1x: string;
	image2x: string;
	image4x: string;
	setID: string;
	title: string;
	version: string;
	__typename: string;
}

export interface TwTypeMessage {
	id: string;
	sentAt: string;
	deletedAt: string | null;
	content: {
		text: string;
	};
	sender: TwTypeUser;
	replies: {
		id: string;
		totalCount: number;
		nodes: TwTypeMessage[];
	};
}

export interface TwTypeModComment {
	id: string;
	author: TwTypeUser;
	channel: TwTypeUser;
	text: string;
	target: TwTypeUser;
	timestamp: string;
}

export interface TwTypeModEntry {
	id: string;
	action: "TIMEOUT_USER" | "UNTIMEOUT_USER" | "BAN_USER" | "UNBAN_USER";
	details: TwTypeModActionDetails;
	timestamp: string;
	channel: Pick<TwTypeUser, "id" | "login">;
	target: Pick<TwTypeUser, "id" | "login">;
	user: Pick<TwTypeUser, "id" | "login">;
}

export interface TwTypeModActionDetails {
	bannedAt: string;
	durationSeconds: number;
	expiresAt: string;
	reason: string | null;
}

export interface TwTypeChatBanStatus {
	bannedUser: TwTypeUser;
	createdAt: string;
	expiresAt: string;
	isPermanent: boolean;
	moderator: TwTypeUser;
	reason: string;
}

export interface TwTypeChannel {
	id: string;
	localEmoteSets: TwTypeEmoteSet[];
}

export interface TwTypeEmoteSet {
	id: string;
	emotes: TwTypeEmote[];
}

export interface TwTypeUserSelfConnection {
	follower: {
		followedAt: string;
	};
	subscriptionBenefit: {
		id: string;
		tier: string;
	};
}

export interface TwTypeSubscriptionProduct {
	id: string;
	name: string;
	displayName: string;
	emotes: TwTypeEmote[];
	tier: string;
	url: string;
}

export interface TwTypeSubscriptionSummary {
	id: string;
	emotes: TwTypeEmote[];
	modifiers: TwTypeEmoteModifier[];
	name: string;
}

export interface TwTypeEmoteModifier {
	code: string;
	name: string;
	subscriptionTier: string;
}

export interface TwTypeSubscriptionOffer {
	currency: string;
	exponent: number;
	id: string;
	price: number;
	promoDescription: string;
}
