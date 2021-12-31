import { settings } from 'src/Content/Runtime/Settings';
import { EmoteStore } from 'src/Global/EmoteStore';
import { MessageRenderer } from 'src/Sites/twitch.tv/Components/MessageRenderer';
import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';


export class MessageTree {
	previousEmote: EmoteStore.Emote | null = null;

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
	getOnClick(emote: Twitch.ChatMessage.EmoteRef): (e: Event) => void {
		return (e: Event): void => {
			const opener = (new Twitch).getEmoteCardOpener();
			const rect = (e.target as HTMLElement).getBoundingClientRect();

			// channelID and channelLogin can be included here.
			// Although i don't know if it changes anything.
			opener.onShowEmoteCard({
				emoteID: emote.emoteID,
				emoteCode: emote.alt,
				sourceID: 'chat',
				initialTopOffset: rect.bottom,
				initialBottomOffset: rect.top
			});
		};
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

		this.previousEmote = null;
		return parts;
	}

	addPart(part: Part): HTMLElement {
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
		span.classList.add('seventv-text-fragment');
		if (part.content === ' ') {
			span.classList.add('seventv-text-empty');
		}
		const color = this.msg.seventv.is_slash_me ? this.msg.user.color : '';
		if (part.content?.toLowerCase().includes(this.msg.seventv?.currentUserLogin)) {
			this.renderer.element?.classList.add('seventv-message-mentioned');
		}

		span.style.color = color;
		span.style.wordBreak = 'break-word';
		span.innerText = part.content as string;
		return span;
	}

	private addCustomEmotePart(part: Part): HTMLElement {
		const emoteStore = this.renderer.app.emoteStore;
		const emoteID = part.content as string;
		const emote = emoteStore.getEmote(emoteID);

		if (!!emote) {
			const emoteElement = emote.toElement(settings.get('general.hide_unlisted_emotes').asBoolean());
			this.considerZeroWidth(emote);
			this.previousEmote = emote;

			return emoteElement;
		}

		return document.createElement('span');
	}

	private addTwitchEmotePart(part: Part): HTMLElement {
		const emoteStore = this.renderer.app.emoteStore;
		const data = part.content as Twitch.ChatMessage.EmoteRef;
		const emote = this.previousEmote = emoteStore.fromTwitchEmote(data);
		const emoteElement = emote.toElement();
		emoteElement.classList.add('twitch-emote');
		emoteElement.onclick = this.getOnClick(data);

		// For cheer emotes, display the amount
		if (typeof data.cheerAmount === 'number' && data.cheerAmount > 0) {
			const cheerText = document.createElement('span');
			cheerText.style.color = data.cheerColor ?? '';
			cheerText.innerText = String(data.cheerAmount);
			emoteElement.firstChild?.appendChild(cheerText);
		}

		this.considerZeroWidth(emote);

		return emoteElement;
	}

	private considerZeroWidth(emote: EmoteStore.Emote): void {
		// If this emote is zerowidth, we must check the previous emote
		if (emote.isZeroWidth() && !!this.previousEmote) {
			// Previous emote should be the target for this zero-width emmote
			// Add css class
			this.previousEmote.element?.classList.add('seventv-next-is-zerowidth');

			if (!!emote.element && !!this.previousEmote.element?.style.minWidth) {
				emote.element.style.minWidth = this.previousEmote.element?.style.minWidth;
			}
		}
	}

	private addMentionPart(part: Part): HTMLSpanElement {
		const span = document.createElement('span');
		span.classList.add('seventv-mention');
		span.innerHTML = `@${part.content}`;
		if (!!part.content && part.content?.toLowerCase() === this.msg.seventv?.currentUserLogin) {
			this.renderer.element?.classList.add('seventv-message-mentioned');
		}

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
