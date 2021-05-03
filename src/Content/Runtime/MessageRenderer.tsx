import { Twitch } from 'src/Page/Util/Twitch';
import React from 'react';
import ReactDOM from 'react-dom';
import { EmoteComponent } from 'src/Content/Components/EmoteComponent';
import { MessageBody } from 'src/Page/Components/MessageBody';
import { App } from 'src/Content/App/App';

export class MessageRenderer {
	private jsx = [] as JSX.Element[];
	constructor(
		public app: App,
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

		ReactDOM.render(<MessageBody renderer={this} id={this.msg.id} parts={this.jsx} />, newContext);
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
				}

				jsxArray.push(...localJsxArray);
				if (currentText.length > 0) jsxArray.push(createSpan(currentText.join(' ')));
			} else if (type === 'emote') {
				const id = content as string;
				const emote = this.app.emotes.getEmote(id);

				if (!!emote) {
					const reactElement = this.app.emotes.getElement(emote.name) ?? this.app.emotes.addElement(emote.name, <EmoteComponent
						emote={emote}
					/>);

					jsxArray.push(reactElement);
				}
			} else if (type === 'twitch-emote') {
				const data = content as Twitch.ChatMessage.EmoteRef;
				const emote = this.app.emotes.fromTwitchEmote(data);

				jsxArray.push(emote.toJSX(this.app.emotes));
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
