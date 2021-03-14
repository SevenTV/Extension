import { Twitch } from 'src/Page/Util/Twitch';
import React from 'react';
import ReactDOM from 'react-dom';
import { DataStructure } from '@typings/typings/DataStructure';
import { Config } from 'src/Config';
import { Emote } from 'src/Page/Components/EmoteComponent';
import { Content } from 'src/Content/Content';
import { MessageBody } from 'src/Page/Components/MessageBody';

export class MessageRenderer {
	private jsx = [] as JSX.Element[];
	constructor(
		public msg: Twitch.ChatMessage,
		public elementId: string
	) { }

	getChatContainer() {
		return document.querySelector(Twitch.Selectors.ChatScrollableContainer);
	}

	getElement(): HTMLDivElement | null {
		return document.getElementById(this.elementId) as HTMLDivElement;
	}

	insert(): void {
		const el = this.getElement();
		if (!el) return undefined;

		const container = el.querySelector('.chat-line__no-background') ?? el;
		el.querySelector('.message')?.remove();
		const newContext = document.createElement('span');
		newContext.classList.add('7tv-message-context');
		newContext.style.display = 'inline-block';

		ReactDOM.render(<MessageBody parts={this.jsx} />, newContext);
		container.appendChild(newContext);
	}

	/**
	 * Create a new message tree
	 */
	renderMessageTree(): JSX.Element[] {
		const parts = this.msg.seventv.parts; // Get the tokenized emotes
		const words = this.msg.seventv.words;
		const element = this.getElement();
		const jsxArray = [] as JSX.Element[];

		let index = 0;
		if (!element) return [];
		for (const { type, content } of parts) {
			if (type === 'text') {
				let text = content as string;
				// Scan for first party or other third party emotes
				for (let i = 0; i < words.length; ++i) {
					const word = words[i];
					if (word.trim().length === 0 || !text.includes(word)) continue;

					// Pull the emote out (7tv-superceded)
					const superceded = element.querySelector(`img[alt="${word.replace(/"/g, '\\"')}"]`) as HTMLImageElement;
					if (!superceded) continue;

					text = text.replace(word, '');
					jsxArray.push(Content.EmoteStore.getElement(superceded.alt) ?? Content.EmoteStore.addElement(superceded.alt, <Emote
						src={{ preview: superceded.src, small: superceded.src }}
						provider={superceded.getAttribute('data-provider') ?? 'N/A'}
						name={superceded.alt}
					/>));
				}

				jsxArray.push(
					(<span className='text-fragment 7tv-txf'> {text as string} </span>)
				);
			} else if (type === 'emote') {
				const emote = content as DataStructure.Emote;

				const reactElement = Content.EmoteStore.getElement(emote.name) ?? Content.EmoteStore.addElement(emote.name, <Emote
					src={{ preview: `${Config.cdnUrl}/emote/${emote._id}/3x`, small: `${Config.cdnUrl}/emote/${emote._id}/1x` }}
					provider='7TV'
					name={emote.name}
					ownerName={emote.owner_name}
					global={emote.global}
				/>);

				jsxArray.push(reactElement);
			}
			index++;
		}

		return this.jsx = jsxArray;
	}
}
