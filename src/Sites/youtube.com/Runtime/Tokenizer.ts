import { YouTube } from 'src/Sites/youtube.com/Util/YouTube';
import { YouTubePageScript } from 'src/Sites/youtube.com/youtube';


export class Tokenizer {
	content: HTMLDivElement | null = null;
	contentMessage: HTMLSpanElement | null = null;
	eIndex = this.page.getEmoteIndex();

	constructor(
		private page: YouTubePageScript,
		private element: YouTube.MessageElement
	) {}

	get data(): YouTube.MessageData {
		return this.element.__data;
	}

	validate(): boolean {
		this.content = this.element.querySelector<HTMLDivElement>('div#content') ?? null;
		this.contentMessage = this.content?.querySelector<HTMLSpanElement>('span#message') ?? null;

		return !!this.content && !!this.contentMessage;
	}

	generateTree(): HTMLSpanElement {
		this.element.__data.data.seventv = [];

		this.content?.classList.add('with-seventv', 'seventv-yt');
		const newContext = document.createElement('span');
		newContext.classList.add('seventv-message-context', 'seventv-yt');

		for (let i = 0; i < this.element.__data.data.message.runs.length; i++) {
			const part = this.element.__data.data.message.runs[i];

			if (!!part.emoji) {
				this.addEmojiPart(newContext, part.emoji);
			} else if (!!part.text) {
				for (let s of part.text.split(' ')) {
					const ok = this.addEmotePart(newContext, s);
					if (!ok) {
						this.addTextPart(newContext, s);
					}
				}
			}
		}

		return newContext;
	}

	addTextPart(ctx: HTMLSpanElement, text: string): void {
		const span = document.createElement('span');
		span.classList.add('seventv-text-fragment', 'seventv-yt');

		span.style.wordWrap = 'break-word';
		span.innerText = text;
		span.querySelectorAll('br').forEach(e => e.remove());
		ctx.appendChild(span);
	}

	addEmojiPart(ctx: HTMLSpanElement, emoji: YouTube.Emoji): void {
		const img = document.createElement('img');
		img.className = 'emoji yt-formatted-string style-scope yt-live-chat-text-message-renderer';
		img.src = emoji.image?.thumbnails?.[0]?.url ?? '';
		img.alt = emoji.searchTerms?.[0] ?? 'ytemoji';

		ctx.appendChild(img);
	}

	addEmotePart(ctx: HTMLSpanElement, emoteName: string): boolean {
		const emote = this.eIndex[emoteName];

		if (!!emote) {
			const emoteElement = emote.toElement(this.page.site.config.get('general.hide_unlisted_emotes')?.asBoolean());
			ctx.appendChild(emoteElement);
			return true;
		}
		return false;
	}
}
