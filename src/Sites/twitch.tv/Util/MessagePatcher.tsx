import { MessageRenderer } from 'src/Sites/twitch.tv/Components/MessageRenderer';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';
import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';

export class MessagePatcher {
	constructor(
		private page: TwitchPageScript,
		private msg: Twitch.ChatMessage
	) { }

	/**
	 * Tokenize the chat line, inserting emote data into the seventv namespace of message data
	 */
	tokenize(): void {
		// Begin iterating through message parts
		// Daily Quest: find 7TV emotes ZULUL
		const eIndex = this.page.getEmoteIndex();

		// Find all emotes across the message parts
		for (const part of this.msg.messageParts) {
			// Handle link / mention
			if (part.type === 4) { // Is mention
				this.msg.seventv.parts.push({ type: 'mention', content: (part.content as any).recipient });
				continue;
			} else if (part.type === 5) { // Is link
				this.msg.seventv.parts.push({ type: 'link', content: part.content });
			} else if (part.type === 6) { // Is twitch emote
				const content = part.content as Twitch.ChatMessage.EmoteRef;
				this.msg.seventv.parts.push({
					type: 'twitch-emote',
					content
				});

				continue;
			}

			// Get part text content
			const text: string = (part.content as any)?.alt ?? part.content as string;
			if (typeof text !== 'string') continue;

			// Check if part contains one or more 7TV emotes?
			const matches = this.page.emoteRegex as RegExp;

			// Apply matches to message parts
			const foundEmotes = text.match(matches)
				?.map(emoteName => eIndex[emoteName]) ?? [];
			const foundEmoteNames = foundEmotes.filter(e => !!e)?.map(e => e.name) ?? [];

			const words = text.match(MessagePatcher.getRegexp());
			if (!words) continue;

			// Iterate through words in this part
			// Check for emotes, and append to seventv namespace
			let currentStack = [] as string[];
			const pushCurrentStack = (): void => { // Push the current word stack
				if (currentStack.length === 0) return undefined;

				this.msg.seventv.parts.push({ type: 'text', content: currentStack.join(' ') });
				currentStack = [];
			};
			for (const word of words) {
				const isEmote = foundEmoteNames.includes(word); // Is this word an emote?
				if (isEmote) {
					pushCurrentStack(); // Push the current word stack as a single part
					// Then push the emote part
					this.msg.seventv.parts.push({
						type: 'emote',
						content: eIndex[word].id
					});
				} else {
					currentStack.push(word);
					this.msg.seventv.words.push(word);
				}
			}
			pushCurrentStack();
		}
	}

	/**
	 * Render the message with 7TV emotes
	 */
	render(line: Twitch.ChatLineAndComponent): void {
		// Hide twitch fragments
		const oldFragments = Array.from(line.element.querySelectorAll<HTMLSpanElement | HTMLImageElement>('span.text-fragment, span.mention-fragment, a.link-fragment, img.chat-line__message--emote, [data-test-selector=emote-button]'));
		for (const oldFrag of oldFragments) {
			oldFrag.setAttribute('superceded', '');
			oldFrag.style.display = 'none';
		}

		// Render 7TV third party stuff (and idk...)
		// Send message data back to the content script
		line.element.id = `7TV#msg:${this.msg.id}`; // Give an ID to the message element
		line.element.setAttribute('seventv-id', this.msg.id);
		this.msg.seventv.patcher = null;

		const renderer = new MessageRenderer(this.page.site, this.msg, line.element.id);

		renderer.renderMessageTree();
		renderer.insert();
	}

	/**
	 * Get a Regular Expression matching a list of emotes
	 */
	static getRegexp(emoteNames?: string[]): RegExp {
		return new RegExp(`(?<![^ ])(${!!emoteNames ? emoteNames.join('|').replace(/[-[\]{}()*+?.,\\^$#\s]/g, '\\$&') : '[^ ]*'})(?![^ ])`, 'g');
		// Negative Lookbehind	- Match Enote Names - Negative Lookahead
		// Match space backward or nothing			  Match space forward or nothing
	}
}
