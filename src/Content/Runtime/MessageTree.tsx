import React from 'react';
import { EmoteComponent } from 'src/Content/Components/EmoteComponent';
import { MessageRenderer } from 'src/Content/Runtime/MessageRenderer';
import { Twitch } from 'src/Page/Util/Twitch';


export class MessageTree {
	constructor(private renderer: MessageRenderer) {

	}

	get msg(): Twitch.ChatMessage {
		return this.renderer.msg;
	}

	getMessageColor(): string {
		return this.msg.seventv.is_slash_me ? this.msg.user.color : '';
	}

	getParts(): Part[] {
		return this.msg.seventv.parts;
	}

	getWords(): string[] {
		return this.msg.seventv.words;
	}

	/**
	 * Fill the message tree with content defined by the tokenizer
	 *
	 * @returns an array of elements corresponding to a full message body
	 */
	fill(): JSX.Element[] {
		const parts = [] as JSX.Element[];

		for (const part of this.getParts()) {
			parts.push(this.addPart(part));
		}

		return parts;
	}

	addPart(part: Part): JSX.Element {
		let jsx: JSX.Element;

		switch (part.type) {
			case 'text':
				jsx = this.addTextPart(part);
				break;

			case 'emote':
				jsx = this.addCustomEmotePart(part);
				break;

			case 'twitch-emote':
				jsx = this.addTwitchEmotePart(part);
				break;

			case 'mention':
				jsx = this.addMentionPart(part);
				break;

			case 'link':
				jsx = this.addLinkPart(part);
				break;

			default:
				jsx = <span></span>;
				break;
		}

		return jsx;
	}

	private addTextPart(part: Part): JSX.Element {
		const color = this.msg.seventv.is_slash_me ? this.msg.user.color : '';

		return <span style={{ color, wordWrap: 'break-word' }}>{part.content}</span>;
	}

	private addCustomEmotePart(part: Part): JSX.Element {
		const emoteStore = this.renderer.app.emotes;
		const emoteID = part.content as string;
		const emote = emoteStore.getEmote(emoteID);

		if (!!emote) {
			const reactElement = emoteStore.getElement(emoteID) ?? emoteStore.addElement(emote?.name,
				<EmoteComponent emote={emote}></EmoteComponent>
			);

			return reactElement;
		}

		return <span></span>;
	}

	private addTwitchEmotePart(part: Part): JSX.Element {
		const emoteStore = this.renderer.app.emotes;
		const data = part.content as Twitch.ChatMessage.EmoteRef;
		const emote = emoteStore.fromTwitchEmote(data);

		return emote.toJSX(emoteStore);
	}

	private addMentionPart(part: Part): JSX.Element {
		return <span className='seventv-mention'>@{part.content}</span>;
	}

	private addLinkPart(part: Part): JSX.Element {
		const data = part.content as { displayText: string; url: string; };

		return <a href={data.url} target='_blank'>{data.displayText}</a>;
	}
}

type Part = Twitch.ChatMessage.AppPart | Twitch.ChatMessage.Part;
