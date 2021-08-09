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
	fill(): HTMLElement[] {
		const parts = [] as HTMLElement[];

		for (const part of this.getParts()) {
			parts.push(this.addPart(part));
		}

		return parts;
	}

	addPart(part: Part): HTMLElement{
		let jsx: HTMLElement;

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
				jsx = document.createElement('span');
				break;
		}

		return jsx;
	}

	private addTextPart(part: Part): HTMLSpanElement {
		const span = document.createElement('span');
		const color = this.msg.seventv.is_slash_me ? this.msg.user.color : '';

		span.style.color = color;
		span.style.wordWrap = 'break-word';
		span.innerText = part.content as string;
		return span;
	}

	private addCustomEmotePart(part: Part): HTMLElement {
		const emoteStore = this.renderer.app.emotes;
		const emoteID = part.content as string;
		const emote = emoteStore.getEmote(emoteID);

		if (!!emote) {
			return emote.toElement(this.renderer.app.mainComponent?.getSetting('general.hide_unlisted_emotes').asBoolean());
		}

		return document.createElement('span');
	}

	private addTwitchEmotePart(part: Part): HTMLElement {
		const emoteStore = this.renderer.app.emotes;
		const data = part.content as Twitch.ChatMessage.EmoteRef;
		const emote = emoteStore.fromTwitchEmote(data);

		return emote.toElement();
	}

	private addMentionPart(part: Part): HTMLSpanElement {
		const span = document.createElement('span');
		span.classList.add('seventv-mention');
		span.innerHTML = `@${part.content}`;

		return span;
	}

	private addLinkPart(part: Part): HTMLAnchorElement {
		const data = part.content as { displayText: string; url: string; };
		const link = document.createElement('a');
		link.innerHTML = data.displayText;
		link.href = data.url;
		link.target = '_blank';

		return link;
	}
}

type Part = Twitch.ChatMessage.AppPart;
