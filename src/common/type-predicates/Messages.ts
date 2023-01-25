export function IsChatMessage(msg: Twitch.AnyMessage): msg is Twitch.ChatMessage {
	const x = msg as Twitch.ChatMessage;

	return Array.isArray(x.messageParts) && typeof x.messageType === "number";
}

export function IsLowTrustUserMessage(msg: Twitch.AnyMessage): msg is Twitch.RestrictedLowTrustUserMessage {
	const x = msg as Twitch.RestrictedLowTrustUserMessage;

	return typeof x.sender === "string" && typeof x.sent_at === "string";
}
