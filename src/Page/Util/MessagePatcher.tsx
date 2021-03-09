import { DataStructure } from '@typings/typings/DataStructure';
import { noop } from 'rxjs';
import { Page } from 'src/Page/Page';
import { Twitch } from 'src/Page/Util/Twitch';

export class MessagePatcher {
	constructor(
		private msg: Twitch.ChatMessage,
		private emoteSet: DataStructure.Emote[]
	) { }

	/**
	 * Tokenize the chat line, inserting emote data into the seventv namespace of message data
	 */
	tokenize(): void {
		if (this.emoteSet.length === 0) return undefined;

		// Begin iterating through message parts
		// Daily Quest: find 7TV emotes ZULUL
		const eIndex = Page.EmoteSet.map(e => ({ [e.name]: e })).reduce((a, b) => ({ ...a, ...b }));
		const eNames = Object.keys(eIndex);

		let atIndex = -1;
		for (const part of this.msg.messageParts) {
			++atIndex;

			// Get part text content
			const text: string = (part.content as any)?.alt ?? part.content as string;

			// Check if part contains one or more 7TV emotes?
			const matches = this.getRegexp(eNames);

			// Apply matches to message parts
			const foundEmotes = text.match(matches)
				?.map(emoteName => eIndex[emoteName]);
			if (!foundEmotes) continue; // Stop here if no emotes could be found

			// Splice matches from this message part & order them
			if (part.type === 6) { // Part is emote, but a 7TV emote matched: note this index as a 7TV Emote to be later rerendered
				const emote = foundEmotes[0];

				this.msg.seventv.emotes.push({
					atIndex,
					emote
				});
			} else if (part.type === 0) { // Part is text: match and remove emote tokens
				foundEmotes.map(emote => this.msg.seventv.emotes.push({
					atIndex,
					emote
				}));
			}
		}
	}

	/**
	 * Get a Regular Expression matching a list of emotes
	 */
	private getRegexp(emoteNames: string[]): RegExp {
		return new RegExp(`(?<![^ ])(${emoteNames.join('|')})(?![^ ])`, 'g');
		// Negative Lookbehind	- Match Enote Names - Negative Lookahead
		// Match space backward or nothing			  Match space forward or nothing
	}
}
