import { AnyToken, LinkToken } from "./ChatMessage";
import { log } from "../Logger";
import { parse as tldParse } from "tldts";

export interface UrlMatcherOptions {
	findUrlRegex: RegExp;
	cleanUrlRegex: RegExp;
}

export class UrlMatcherInText {
	private urlMatcherOptions: UrlMatcherOptions = {
		findUrlRegex: /(?:(?:https?:\/\/)|(?:www\.))[^\s]+/g,
		cleanUrlRegex: /^(.+?)([.,;:?!()[\]'"]*)$/,
	};
	private links: LinkToken[] = [];

	constructor(urlMatcherOptions?: UrlMatcherOptions) {
		if (urlMatcherOptions) {
			this.urlMatcherOptions = urlMatcherOptions;
		}
	}

	public getMatchUrl(inputString: string) {
		const { findUrlRegex, cleanUrlRegex } = this.urlMatcherOptions;

		if (!findUrlRegex && !cleanUrlRegex) {
			log.error("UrlMatcherInText: No regex provided for finding urls");
			return this;
		}

		let match: RegExpExecArray | null;

		if (this.links.length) {
			this.links = [];
		}

		do {
			match = findUrlRegex.exec(inputString);

			if (match) {
				const dirtyUrl = match[0];
				const urlDirtyMatch = cleanUrlRegex.exec(dirtyUrl);

				if (urlDirtyMatch) {
					const url = this.isValidLink(urlDirtyMatch[1]);

					if (url) {
						const startRange = match.index;
						const endRange = urlDirtyMatch[1].length + match.index - 1;

						this.addUrl(url, [startRange, endRange]);
					}
				}
			}
		} while (match);

		return this;
	}

	public addUrlTokens(tokens: AnyToken[]) {
		if (this.links.length > 0) {
			this.links.forEach((linkToken) => tokens.push(linkToken));
		}

		return this;
	}

	private addUrl(url: URL, range: [number, number]) {
		if (!url && range.length < 2) {
			log.error("UrlMatcherInText: No url provided for adding");
			return;
		}

		this.links.push({
			kind: "LINK",
			content: {
				displayText: url.toString(),
				url: url.toString(),
			},
			range,
		});
	}

	private isValidLink(link: string): URL | null {
		try {
			const url = new URL(link);
			const { isIcann, domain } = tldParse(url.hostname);

			if (domain && isIcann) {
				return url;
			}
		} catch (e) {
			void 0;
		}

		return null;
	}
}
