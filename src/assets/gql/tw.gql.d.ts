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
	profileImageURL: string;
	stream: unknown;
	channel: TwTypeChannel;
	self: TwTypeUserSelfConnection;
	blockedUsers: TwTypeUser[];
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
