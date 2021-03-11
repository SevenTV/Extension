import { DataStructure } from '@typings/typings/DataStructure';
import { filter, map, take } from 'rxjs/operators';
import { Page } from 'src/Page/Page';
import { Twitch } from 'src/Page/Util/Twitch';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Emote } from 'src/Page/Components/EmoteComponent';
import { Config } from 'src/Config';

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

		// Find all emotes across the message parts
		const emotes = [] as DataStructure.Emote[];
		for (const part of this.msg.messageParts) {
			// Get part text content
			const text: string = (part.content as any)?.alt ?? part.content as string;

			// Check if part contains one or more 7TV emotes?
			const matches = this.getRegexp(eNames);

			// Apply matches to message parts
			const foundEmotes = text.match(matches)
				?.map(emoteName => eIndex[emoteName]) ?? [];
			const foundEmoteNames = foundEmotes?.map(e => e.name) ?? [];

			const words = text.match(this.getRegexp());
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
	render(): void {
		const domObserver = Page.ChatListener.newLine; // Get DOM Observer (for receiving element & component of the message)

		domObserver.pipe(
			filter(line => line.component.props.message.id === this.msg.id),
			take(1),

			map(line => ({
				...line,
				jsx: this.renderMessageTree(line)
			})),

			map(({ element, jsx }) => {
				// Hide twitch fragments
				const fragments = element.querySelectorAll<HTMLSpanElement | HTMLImageElement>('span.text-fragment, img.chat-line__message--emote');
				fragments.forEach(oldFrag => {
					oldFrag.setAttribute('superceded', '');
					oldFrag.style.display = 'none';
				});

				// Render 7TV third party stuff (and idk...)
				const newContext = document.createElement('span');
				newContext.classList.add('7tv-message-context');
				newContext.style.display = 'inline-block';

				ReactDOM.render(jsx, newContext);
				(element.querySelector(Twitch.Selectors.ChatMessageContainer) ?? element).appendChild(newContext);
			})
		).subscribe();
	}

	/**
	 * Create a new message tree
	 */
	private renderMessageTree(line: Twitch.ChatLineAndComponent): JSX.Element[] {
		const parts = this.msg.seventv.parts; // Get the tokenized emotes
		const words = this.msg.seventv.words;
		const jsxArray = [] as JSX.Element[];

		for (const { type, content } of parts) {
			if (type === 'text') {
				let text = content as string;
				// Scan for first party or other third party emotes
				for (const word of words) {
					if (word.trim().length === 0 || !text.includes(word)) continue;

					// Pull the emote out (7tv-superceded)
					const superceded = line.element.querySelector(`img[alt="${word.replace(/"/g, '\\"')}"]`) as HTMLImageElement;
					if (!superceded) continue;

					text = text.replace(word, '');
					jsxArray.push(<Emote
						src={{ preview: superceded.src, small: superceded.src }}
						provider={superceded.getAttribute('data-provider') ?? 'N/A'}
						name={superceded.alt}
					/>);
				}

				jsxArray.push(
					( <span className='text-fragment'> {text as string} </span> )
				);
			} else if (type === 'emote') {
				const emote = content as DataStructure.Emote;

				jsxArray.push(<Emote
					src={{ preview: `${Config.cdnUrl}/emote/${emote._id}/3x`, small: `${Config.cdnUrl}/emote/${emote._id}/1x` }}
					provider='7tv'
					name={emote.name}
					ownerName={emote.owner_name}
					global={emote.global}
				/>);
			}
		}

		return jsxArray;
	}

	/**
	 * Get a Regular Expression matching a list of emotes
	 */
	private getRegexp(emoteNames?: string[]): RegExp {
		return new RegExp(`(?<![^ ])(${!!emoteNames ? emoteNames.join('|') : '[^ ]*'})(?![^ ])`, 'g');
		// Negative Lookbehind	- Match Enote Names - Negative Lookahead
		// Match space backward or nothing			  Match space forward or nothing
	}
}
