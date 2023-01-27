export function IsChatMessage(msg: Twitch.AnyMessage): msg is Twitch.ChatMessage {
	const x = msg as Twitch.ChatMessage;

	return Array.isArray(x.messageParts) && typeof x.messageType === "number";
}

export function IsDisplayableMessage(msg: Twitch.AnyMessage): msg is Twitch.DisplayableMessage {
	const x = msg as Twitch.DisplayableMessage;

	return Array.isArray(x.messageParts) || typeof x.message === "object";
}

export function IsLowTrustUserMessage(msg: Twitch.AnyMessage): msg is Twitch.RestrictedLowTrustUserMessage {
	const x = msg as Twitch.RestrictedLowTrustUserMessage;

	return typeof x.sender === "string" && typeof x.sent_at === "string";
}

export function IsModerationMessage(msg: Twitch.AnyMessage): msg is Twitch.ModerationMessage {
	const x = msg as Twitch.ModerationMessage;

	return typeof x.moderationType === "number";
}

export function IsSubMessage(msg: Twitch.AnyMessage): msg is Twitch.SubMessage {
	const x = msg as Twitch.SubMessage;

	return typeof x.methods === "object" && typeof x.user === "string" && typeof x.months === "number";
}
