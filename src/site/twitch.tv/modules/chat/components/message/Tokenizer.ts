import { convertCheerEmote, convertTwitchEmote } from "@/common/Transform";
import { MessagePartType, Regex } from "@/site/twitch.tv";

export class Tokenizer {
	private newParts = new Array<Twitch.ChatMessage.Part>();

	constructor(private parts: Twitch.ChatMessage.Part[]) {}

	private tokenizeText(content: string, emoteMap: Record<string, SevenTV.ActiveEmote>) {
		const remainder = content.split(Regex.MessageDelimiter).reduce((pre, cur) => {
			const emote = emoteMap[cur];

			if (!emote) return pre + cur;

			if (pre != "") this.newParts.push(stringToPart(pre));

			this.handleFoundEmote(emote);

			return "";
		}, "");

		if (remainder == "") return;

		this.newParts.push(stringToPart(remainder));
	}

	private handleFoundEmote(emote: SevenTV.ActiveEmote) {
		// Check if emote is zeroWidth and the preceding non space element is an emote
		if (
			(emote.data?.flags ?? 0) & 256 &&
			this.newParts.at(-1)?.content == " " &&
			this.newParts.at(-2)?.type == MessagePartType.SEVENTVEMOTE
		) {
			// Remove the " " space element
			this.newParts.pop();

			const previousEmote = this.newParts.pop()?.content as SevenTV.ActiveEmote;

			this.newParts.push(sevenTVEmoteToPart(previousEmote, emote));
			return;
		}

		this.newParts.push(sevenTVEmoteToPart(emote));
	}

	public getParts(emoteMap: Record<string, SevenTV.ActiveEmote>) {
		this.newParts = [];
		for (const part of this.parts) {
			switch (part.type) {
				case MessagePartType.TEXT:
					this.tokenizeText(part.content, emoteMap);
					break;
				case MessagePartType.EMOTE:
					this.newParts.push(twitchEmoteToPart(part.content));
					break;
				case MessagePartType.LINK:
					this.newParts.push(matchLink(part.content));
					break;
				default:
					this.newParts.push(part);
			}
		}
		return this.newParts;
	}
}

function matchLink(content: { displayText: string; url: string }): Twitch.ChatMessage.Part {
	const match = content.url.match(Regex.SevenTVLink);
	if (match) return linkToSevenTVLink(content, match[0]);
	return {
		type: MessagePartType.LINK,
		content: content,
	};
}

function stringToPart(content: string): Twitch.ChatMessage.Part {
	return {
		type: MessagePartType.TEXT,
		content: content,
	};
}

// Use type instead
function linkToSevenTVLink(content: Twitch.ChatMessage.LinkPart["content"], emoteID: string): Twitch.ChatMessage.Part {
	return {
		type: MessagePartType.SEVENTVLINK,
		content: {
			...content,
			emoteID: emoteID,
		},
	};
}

function twitchEmoteToPart(emote: Twitch.ChatMessage.EmotePart["content"]): Twitch.ChatMessage.Part {
	if (emote.cheerAmount !== undefined)
		return {
			type: MessagePartType.SEVENTVEMOTE,
			content: {
				id: emote.emoteID,
				name: `${emote.alt} ${emote.cheerAmount}`,
				flags: 0,
				data: convertCheerEmote(emote),
				provider: "TWITCH",
				cheerAmount: emote.cheerAmount,
				cheerColor: emote.cheerColor,
			} as SevenTV.ActiveEmote,
		};
	else
		return {
			type: MessagePartType.SEVENTVEMOTE,
			content: {
				id: emote.emoteID,
				name: emote.alt,
				flags: 0,
				data: convertTwitchEmote({ id: emote.emoteID, token: emote.alt }),
				provider: "TWITCH",
			} as SevenTV.ActiveEmote,
		};
}

function sevenTVEmoteToPart(emote: SevenTV.ActiveEmote, zeroWidth?: SevenTV.ActiveEmote): Twitch.ChatMessage.Part {
	if (!zeroWidth)
		return {
			type: MessagePartType.SEVENTVEMOTE,
			content: emote,
		};

	const o = emote.overlaid ?? {};
	o[zeroWidth.name] = zeroWidth;
	return {
		type: MessagePartType.SEVENTVEMOTE,
		content: {
			...emote,
			overlaid: o,
		},
	};
}
