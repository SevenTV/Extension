import { YouTube } from 'src/Sites/youtube.com/Util/YouTube';


export class Tokenizer {
	content: HTMLDivElement | null = null;
	contentMessage: HTMLSpanElement | null = null;

	constructor(private element: YouTube.MessageElement) {
		element.__data.data.message.runs[0].text = 'COCK';
	}

	get data(): YouTube.MessageData {
		return this.element.__data;
	}

	validate(): boolean {
		this.content = this.element.querySelector<HTMLDivElement>('div#content') ?? null;
		this.contentMessage = this.content?.querySelector<HTMLSpanElement>('span#message') ?? null;

		return !!this.content && !!this.contentMessage;
	}
}
