import { DataStructure } from '@typings/typings/DataStructure';
import { Page } from 'src/Page/Page';
import { Twitch } from 'src/Page/Util/Twitch';

export class MessagePatcher {
	static cachedEmotes = new Map<string, JSX.Element>();
	static trash = document.createElement('trash');

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

		// Find all emotes across the message parts
		const emotes = [] as DataStructure.Emote[];
		for (const part of this.msg.messageParts) {
			// Handle link / mention
			if (part.type === 4) { // Is mention
				this.msg.seventv.parts.push({ type: 'mention', content: (part.content as any).recipient });
				continue;
			} else if (part.type === 5) { // Is link
				this.msg.seventv.parts.push({ type: 'link', content: part.content });
			}

			// Get part text content
			const text: string = (part.content as any)?.alt ?? part.content as string;
			if (typeof text !== 'string') continue;

			// Check if part contains one or more 7TV emotes?
			const matches = MessagePatcher.getRegexp(eNames);

			// Apply matches to message parts
			const foundEmotes = text.match(matches)
				?.map(emoteName => eIndex[emoteName]) ?? [];
			const foundEmoteNames = foundEmotes?.map(e => e.name) ?? [];

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
					this.msg.seventv.parts.push({ type: 'emote', content: eIndex[word] });
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
		const oldFragments = Array.from(line.element.querySelectorAll<HTMLSpanElement | HTMLImageElement>('span.text-fragment, img.chat-line__message--emote'));
		for (const oldFrag of oldFragments) {
			oldFrag.setAttribute('superceded', '');
			oldFrag.style.display = 'none';
		}

		// Render 7TV third party stuff (and idk...)
		// Send message data back to the content script
		line.element.id = `7TV#msg:${this.msg.id}`; // Give an ID to the message element
		this.msg.seventv.patcher = null;
		const data = JSON.stringify({
			msg: this.msg,
			elementId: line.element.id
		}); // Rendering the message body moves on Content.MessageRenderer from now on
		window.dispatchEvent(new CustomEvent('7TV#RenderChatLine', { detail: data } ));
	} // [i] This is done on the pagescript, because Twitch will maintain references to our React components and cause a memory leak!

	/**
	 * Get a Regular Expression matching a list of emotes
	 */
	static getRegexp(emoteNames?: string[]): RegExp {
		return new RegExp(`(?<![^ ])(${!!emoteNames ? emoteNames.join('|') : '[^ ]*'})(?![^ ])`, 'g');
		// Negative Lookbehind	- Match Enote Names - Negative Lookahead
		// Match space backward or nothing			  Match space forward or nothing
	}
}
