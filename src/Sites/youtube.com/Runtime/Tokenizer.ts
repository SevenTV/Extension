import { EmoteStore } from 'src/Global/EmoteStore';
import { YouTube } from 'src/Sites/youtube.com/Util/YouTube';
import { YouTubePageScript } from 'src/Sites/youtube.com/youtube';


export class Tokenizer {
	content: HTMLDivElement | null = null;
	contentMessage: HTMLSpanElement | null = null;
	previousEmote: EmoteStore.Emote | null = null;

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
		const me = this.element.querySelector('.mention')?.textContent ?? '';

		for (let i = 0; i < this.element.__data.data.message.runs.length; i++) {
			const part = this.element.__data.data.message.runs[i];

			if (!!part.emoji) {
				this.addEmojiPart(newContext, part.emoji);
			} else if (!!part.text) {
				for (let s of part.text.split(' ')) {
					const isEmote = this.addEmotePart(newContext, s);
					if (!isEmote) {
						const isMention = this.addMentionPart(newContext, s, me);
						if (!isMention) {
							this.addTextPart(newContext, ' ');
							this.addTextPart(newContext, s + ' ');
						}
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
	 * Append a mention part to the new message context
	 */
	addMentionPart(ctx: HTMLSpanElement, text: string, me: string): boolean {
		if (text == me){
			const span = document.createElement('span');
			span.innerText = text;
			span.style.background = 'var(--yt-live-chat-mention-background-color)';
			span.style.padding = '2px 4px';
			span.style.borderRadius = '2px';

			ctx.appendChild(span);
			return true;
		}
		return false;
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
			this.considerZeroWidth(emote);
			this.previousEmote = emote;
			return true;
		}
		return false;
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
}
