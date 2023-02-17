import { AnyToken, ChatMessage, EmoteToken, LinkToken, MentionToken } from "@/common/chat/ChatMessage";
import { Regex } from "@/site/twitch.tv";

export class Tokenizer {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(private msg: ChatMessage<any>) {}

	tokenize(opt: TokenizeOptions) {
		const tokens = [] as AnyToken[];

		const textParts = this.msg.body.split(" ");
		const getEmote = (name: string) => opt.localEmoteMap?.[name] ?? opt.emoteMap[name];

		let cursor = -1;
		let lastEmoteToken: EmoteToken | undefined = undefined;

		for (const part of textParts) {
			const next = cursor + (part.length + 1);

			// tokenize emote?
			const emote = getEmote(part);
			if (emote) {
				// handle zero width overlaying
				if ((emote.data?.flags ?? 0) & 256 && lastEmoteToken) {
					lastEmoteToken.content.overlaid[emote.name] = emote;

					// the "void" token is used to hide the text of the zero-width. any text in the void range won't be rendered
					tokens.push({
						kind: "VOID",
						range: [cursor + 1, next - 1],
						content: void 0,
					});
				} else {
					// regular emote
					tokens.push(
						(lastEmoteToken = {
							kind: "EMOTE",
							range: [cursor + 1, next - 1],
							content: {
								emote,
								overlaid: {},
								...(emote.isTwitchCheer
									? {
											cheerAmount: emote.isTwitchCheer.amount,
											cheerColor: emote.isTwitchCheer.color,
									  }
									: {}),
							} as EmoteToken["content"],
						}),
					);
				}
			} else {
				lastEmoteToken = undefined;
			}

			// Check link
			if (part.match(Regex.Link)) {
				tokens.push({
					kind: "LINK",
					range: [cursor + 1, next - 1],
					content: {
						displayText: part,
						url: part.startsWith("https://") ? part : "https://" + part,
					},
				} as LinkToken);
			} else if (part.match(Regex.Mention)) {
				//  Check mention
				const username = part.slice(1);

				tokens.push({
					kind: "MENTION",
					range: [cursor + 1, next - 1],
					content: {
						displayText: part,
						recipient: username,
					} as MentionToken["content"],
				});

				this.msg.mentions.add(username);
			}

			cursor = next;
		}

		tokens.sort((a, b) => a.range[0] - b.range[0]);

		return (this.msg.tokens = tokens);
	}
}

export interface TokenizeOptions {
	emoteMap: Record<string, SevenTV.ActiveEmote>;
	localEmoteMap?: Record<string, SevenTV.ActiveEmote>;
	filteredWords?: string[];
	actorUsername?: string;
}
