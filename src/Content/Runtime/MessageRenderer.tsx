import { Twitch } from 'src/Page/Util/Twitch';
import React from 'react';
import ReactDOM from 'react-dom';
import { EmoteComponent } from 'src/Content/Components/EmoteComponent';
import { MessageBody } from 'src/Page/Components/MessageBody';
import { App } from 'src/Content/App/App';
import { EmoteStore } from 'src/Global/EmoteStore';

export class MessageRenderer {
	private jsx = [] as JSX.Element[];
	constructor(
		private app: App,
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

		const container = el.querySelector('.chat-line__no-background') ?? el.querySelector(Twitch.Selectors.ChatMessageContainer) ?? el;
		el.querySelector('.message')?.remove();
		const newContext = document.createElement('span');
		newContext.classList.add('7tv-message-context');
		newContext.style.position = 'relative';

		ReactDOM.render(<MessageBody parts={this.jsx} />, newContext);
		container.appendChild(newContext);
	}

	/**
	 * Create a new message tree
	 */
	renderMessageTree(): JSX.Element[] {
		const color = this.msg.seventv.is_slash_me ? this.msg.user.color : '';
		const parts = this.msg.seventv.parts; // Get the tokenized emotes
		const words = this.msg.seventv.words;
		const element = this.getElement();
		const jsxArray = [] as JSX.Element[];

		let index = 0;
		if (!element) return [];
		for (const { type, content } of parts) {
			const localJsxArray = [] as JSX.Element[];
			if (type === 'text') {
				let text = content as string;
				let currentText = [] as string[];
				// Scan for first party or other third party emotes
				const createSpan = (text: string): JSX.Element => (<span style={{ color, wordWrap: 'break-word' }} className='text-fragment 7tv-txf'> {text} </span>);
				for (let i = 0; i < words.length; ++i) {
					const word = words[i];
					if (word.trim().length === 0 || !text.includes(word)) continue;
					text = text.replace(word, '');

					// Pull the emote out (7tv-superceded)
					const target = word.replace(/"/g, '\\"').trimEnd();
					const superceded = element.querySelector(`img[alt="${target}"]`) as HTMLImageElement;
					if (!superceded) {
						currentText.push(word);
						continue;
					} else {
						localJsxArray.push(
							createSpan(currentText.join(' '))
						);
						currentText = [];
					}

					localJsxArray.push(this.app.emotes.getElement(superceded.alt) ?? this.app.emotes.addElement(superceded.alt, <EmoteComponent
						emote={new EmoteStore.Emote({} as any) as EmoteStore.Emote}
						// src={{ preview: superceded.src.replace(/1(?![\s\S]*1)/, '3'), small: superceded.src }}
						// provider={superceded.getAttribute('data-provider') ?? 'Twitch'}
						// name={superceded.alt}
					/>));
				}

				jsxArray.push(...localJsxArray);
				if (currentText.length > 0) jsxArray.push(createSpan(currentText.join(' ')));
			} else if (type === 'emote') {
				const id = content as string;
				const emote = this.app.emotes.getEmote(id);

				if (!!emote) {
					const reactElement = this.app.emotes.getElement(emote.name) ?? this.app.emotes.addElement(emote.name, <EmoteComponent
					emote={emote}
						// src={{ preview: `${Config.cdnUrl}/emote/${emote._id}/3x`, small: `${Config.cdnUrl}/emote/${emote._id}/1x` }}
						// provider='7TV'
						// name={emote.name}
						// ownerName={emote.owner_name}
						// global={emote.global}
					/>);

					jsxArray.push(reactElement);
				}
			} else if (type === 'twitch-emote') {
				const data = content as Twitch.ChatMessage.EmoteRef;
				const emote = this.app.emotes.fromTwitchEmote(data);

				jsxArray.push(emote.toJSX());
			} else if (type === 'mention') {
				jsxArray.push(<strong> @{content} </strong>);
			} else if (type === 'link') {
				jsxArray.push(<a href={(content as any).url} target='_blank'> {(content as any).displayText} </a>);
			}
			index++;
		}

		return this.jsx = jsxArray;
	}
}
