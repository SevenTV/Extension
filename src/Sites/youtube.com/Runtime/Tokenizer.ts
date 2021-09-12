

export class Tokenizer {
	content: HTMLDivElement | null = null;
	contentMessage: HTMLSpanElement | null = null;

	constructor(private element: HTMLDivElement) {}

	validate(): boolean {
		this.content = this.element.querySelector<HTMLDivElement>('div#content') ?? null;
		this.contentMessage = this.content?.querySelector<HTMLSpanElement>('span#message') ?? null;

		return !!this.content && !!this.contentMessage;
	}
}
