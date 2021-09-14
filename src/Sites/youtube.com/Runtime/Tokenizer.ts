import { YouTube } from 'src/Sites/youtube.com/Util/YouTube';
import { YouTubePageScript } from 'src/Sites/youtube.com/youtube';


export class Tokenizer {
	content: HTMLDivElement | null = null;
	contentMessage: HTMLSpanElement | null = null;

	constructor(
		private page: YouTubePageScript,
		private element: YouTube.MessageElement
	) {}

	get data(): YouTube.MessageData {
		return this.element.__data;
	}

	/**
	 * Validate that the given element is a valid message
	 */
	validate(): boolean {
		this.content = this.element.querySelector<HTMLDivElement>('div#content') ?? null;
		this.contentMessage = this.content?.querySelector<HTMLSpanElement>('span#message') ?? null;

		return !!this.content && !!this.contentMessage;
	}

	/**
	 *  Generate a new message body tree containing modified text and emotes
	 */
	generateTree(): HTMLSpanElement {
		this.element.__data.data.seventv = [];
		const newContext = document.createElement('span');
		newContext.classList.add('seventv-yt-message-content');

		for (let i = 0; i < this.element.__data.data.message.runs.length; i++) {
			const part = this.element.__data.data.message.runs[i];

			if (!!part.emoji) {
				this.addEmojiPart(newContext, part.emoji);
			} else if (!!part.text) {
				for (let s of part.text.split(' ')) {
					const ok = this.addEmotePart(newContext, s);
					if (!ok) {
						this.addTextPart(newContext, ' ');
						this.addTextPart(newContext, s + ' ');
					}
				}
			}
		}

		return newContext;
	}

	/**
	 * Append a text part to the new message context
	 */
	addTextPart(ctx: HTMLSpanElement, text: string): void {
		const span = document.createElement('span');
		span.innerText = text;
		if (span.innerText === ' ') {
			span.style.width = '0.25rem';
		}

		ctx.appendChild(span);
	}

	/**
	 * Apppend an emoji to the new message context
	 */
	addEmojiPart(ctx: HTMLSpanElement, emoji: YouTube.Emoji): void {
		const img = document.createElement('img');
		img.src = emoji.image?.thumbnails?.[0]?.url ?? '';
		img.alt = emoji.searchTerms?.[0] ?? 'ytemoji';
		img.width = 19.5;
		img.height = 19.5;

		ctx.appendChild(img);
	}

	/**
	 * Apppend an emote to the new message context
	 */
	addEmotePart(ctx: HTMLSpanElement, emoteName: string): boolean {
		const emote = this.page.site.getEmoteIndex()?.[emoteName];

		if (!!emote) {
			const emoteElement = emote.toElement(this.page.site.config.get('general.hide_unlisted_emotes')?.asBoolean());
			ctx.appendChild(emoteElement);
			return true;
		}
		return false;
	}
}
