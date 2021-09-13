import { PageScriptListener } from 'src/Global/Decorators';
import { EmoteStore } from 'src/Global/EmoteStore';
import { SiteApp } from 'src/Sites/app/SiteApp';
import { ChatObserver } from 'src/Sites/youtube.com/Runtime/ChatObserver';
import { YouTube } from 'src/Sites/youtube.com/Util/YouTube';

export class YouTubePageScript {
	site = new SiteApp();
	youtube = (window as any).yt7 = new YouTube();
	chatObserver = new ChatObserver(this);

	constructor() {
		const currentLocation = document.location.href;
		setInterval(() => {
			if (currentLocation !== document.location.href) {
				this.handleNavigationChange();
			}
		}, 500);

		setTimeout(() => {
			this.handleNavigationChange();
		}, 1000);
	}

	handleNavigationChange(): void {
		// Try to find the chat
		const chatContainer = this.youtube.getChatContainer();

		if (!!chatContainer) {
			this.chatObserver.listen();
		}
	}

	@PageScriptListener('EnableEmoteSet')
	onEmoteSet(data: EmoteStore.EmoteSet.Resolved): void {
		this.site.emoteStore.enableSet(data.name, data.emotes);

		page.eIndex = null;
	}

	private eIndex: {
		[x: string]: EmoteStore.Emote;
	} | null = null;
	getEmoteIndex() {
		if (!!this.eIndex) {
			return this.eIndex;
		}

		const emotes = this.getAllEmotes();
		return emotes.length > 0 ? this.eIndex = emotes.map(e => ({ [e.name]: e })).reduce((a, b) => ({ ...a, ...b })) : {};
	}

	getAllEmotes(): EmoteStore.Emote[] {
		const emotes = [] as EmoteStore.Emote[];
		for (const set of this.site.emoteStore.sets.values()) {
			emotes.push(...set.getEmotes().sort((a, b) => a.weight - b.weight));
		}

		return emotes;
	}

	/**
	 * Send a message to the content script layer
	 *
	 * @param tag the event tag
	 * @param data the event data
	 */
	sendMessageUp(tag: string, data: any): void {
		window.dispatchEvent(new CustomEvent(`7TV#${tag}`, { detail: JSON.stringify(data) }));
	}
}

let page: YouTubePageScript;
(() => {
	const { } = page = new YouTubePageScript();
})();
