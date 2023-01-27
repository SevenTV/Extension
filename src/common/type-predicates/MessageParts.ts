import { AnyToken, EmoteToken, LinkToken, MentionToken, TextToken } from "../chat/ChatMessage";

export function IsTextPart(part: AnyToken): part is TextToken {
	return part.kind === "TEXT";
}

export function IsLinkPart(part: AnyToken): part is LinkToken {
	return part.kind === "LINK";
}

export function IsEmotePart(part: AnyToken): part is EmoteToken {
	return part.kind === "EMOTE";
}

export function IsMentionPart(part: AnyToken): part is MentionToken {
	return part.kind === "MENTION";
}
