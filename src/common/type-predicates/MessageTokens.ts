import { AnyToken, EmoteToken, LinkToken, MentionToken, TextToken } from "../chat/ChatMessage";

export function IsTextToken(part: AnyToken): part is TextToken {
	return part.kind === "TEXT";
}

export function IsLinkToken(part: AnyToken): part is LinkToken {
	return part.kind === "LINK";
}

export function IsEmoteToken(part: AnyToken): part is EmoteToken {
	return part.kind === "EMOTE";
}

export function IsMentionToken(part: AnyToken): part is MentionToken {
	return part.kind === "MENTION";
}
