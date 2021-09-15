import { iif, interval, of, Subject, timer } from 'rxjs';
import { filter, map, mapTo, switchMap, take, takeUntil } from 'rxjs/operators';
import { assetStore, SiteApp } from 'src/Sites/app/SiteApp';
import { ChatObserver } from 'src/Sites/youtube.com/Runtime/ChatObserver';
import { YouTube } from 'src/Sites/youtube.com/Util/YouTube';
import { get } from 'superagent';

declare const window: Window & {
	yt: any;
	ytplayer: any;
	ytInitialData: any;
	ytInitialPlayerResponse: any;
};

export class YouTubePageScript {
	site = new SiteApp();
	youtube = (window as any).yt7 = new YouTube();
	chatObserver = new ChatObserver(this);
	navChange = new Subject<string>();

	constructor() {
		document.body.classList.add('seventv-yt-theater-mode');
		// Begin listening to youtube navigation events
		window.addEventListener('yt-navigate-finish', ev => {
			const detail = (ev as CustomEvent<YouTubePageScript.NavigationFinishEventDetail>).detail;
			const channelID = detail.response.playerResponse?.videoDetails?.channelId;
			if (!channelID) {
				return undefined;
			}

			this.handleNavigationChange(detail.response.url, channelID);
		});

		this.handleNavigationChange(document.location.href);

		this.site.menuPickEmote.pipe(
			map(emote => {
				const input = this.youtube.getChatInput();
				if (!input) {
					return undefined;
				}
				if (!input.liveChatRichMessageInput?.textSegments) {
					input.liveChatRichMessageInput = { textSegments: [] };
				}

				input.__data.isInputValid = true;
				input.liveChatRichMessageInput.textSegments.push({ text: emote.name });
				const inputTextField = input.querySelector('#input');
				if (!!inputTextField) {
					inputTextField.textContent += emote.name + ' ';
				}
				if (!input.hasAttribute('has-text')) {
					input.setAttribute('has-text', '');
				}
			})
		).subscribe();
	}

	/**
	 * Handle a change in navigation
	 *
	 * This will attempt to find the current channel ID, and then
	 * try to find an active live chat. If one is found, emotes will be activated
	 */
	handleNavigationChange(url: string, presetChannelId?: string): void {
		this.navChange.next(url);

		// Find the current channel
		if (!!window.yt) {
			const load = () => {
				this.site.eIndex = null;
				this.chatObserver.rerenderAll();
				this.chatObserver.listen();
				this.setupOverlay();
				this.site.embeddedUI.embedChatButton((
					document.querySelector('div#picker-buttons.yt-live-chat-message-input-renderer')?.parentElement ??
					this.youtube.getChatFrame()?.querySelector('div#message-buttons')?.parentElement
				) as HTMLElement);
			};

			iif(
				() => typeof presetChannelId === 'string' && presetChannelId !== '',
				of(presetChannelId),
				timer(0, 1100).pipe(
					takeUntil(this.navChange.pipe(filter(s => s !== url))),
					map(() => presetChannelId ??
						window.yt?.config_?.CHANNEL_ID ??
						window.ytplayer?.bootstrapPlayerResponse?.videoDetails?.channelId ??
						window.ytInitialData?.metadata?.channelMetadataRenderer?.externalId ??
						window.ytInitialPlayerResponse?.videoDetails?.channelId ??
						this.scrapeChannelID()
					),
					take(10),
					filter(v => typeof v === 'string' && v !== ''),
					take(1)
				)
			).pipe(
				switchMap(channelID => interval(500).pipe(
					map(() => document.querySelector<HTMLElement>('yt-live-chat-renderer')),
					map(node => !node ? this.youtube.getChatFrame()?.querySelector<HTMLElement>('yt-live-chat-renderer') : node),
					filter(node => !!node),
					take(1),
					mapTo(channelID)
				)),
				switchMap(channelID => this.site.switchChannel({ channelID: channelID, platform: 'youtube' }))
			).subscribe({ next: () => load() });
		}
	}

	/**
	 * Set up the 7TV UI Overlay
	 */
	setupOverlay(): void {
		const chatFrame = this.youtube.getChatFrame();
		if (!document.querySelector('.seventv-overlay')) {
			// Create Overlay
			const overlayContainer =
				chatFrame?.body?.querySelector('yt-live-chat-app')?.querySelector('yt-live-chat-renderer') as HTMLElement ??
				document.getElementById('body-container') ??
				document.getElementById('contents');
			if (!!overlayContainer) {
				this.site.createOverlay(overlayContainer, -80);
			}
		}

		// Append stylesheets to the chat iframe
		if (!!chatFrame) {
			(async () => {
				const fdoc = chatFrame;
				const stylesUrl = assetStore.get('stylesheet');
				const style = chatFrame.createElement('style');

				const s = await get(stylesUrl ?? '').send();
				const txt = document.createTextNode(s.text);
				style.appendChild(txt);

				fdoc.body?.appendChild(style);
				fdoc.head?.appendChild(style);
			})();
		}
	}

	/**
	 * Scrape the channel ID from the message input
	 * This is a last resort in case it couldn't be found from navigation or yt internal variables
	 */
	private scrapeChannelID(): string {
		const inputRenderer = (document.getElementsByTagName('yt-live-chat-renderer')[0] as HTMLElement & { __data: any; });
		let user: YouTubePageScript.InternalUserData | null = null;
		try {
			user = inputRenderer.__data.data
				.actionPanel
				.liveChatMessageInputRenderer
				.sendButton
				.buttonRenderer
				.serviceEndpoint
				.sendLiveChatMessageEndpoint
				.actions[0]
				.addLiveChatTextMessageFromTemplateAction
				.template
				.liveChatTextMessageRenderer;
		} catch (_) {}

		return user?.authorExternalChannelId ?? '';
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

export namespace YouTubePageScript {
	export interface InternalUserData {
		authorExternalChannelId: string;
		authorName: { simpleText: string };
		authorPhoto: {
			thumbnails: { url: string; width: number; height: number; }[]
		};
	}

	export interface NavigationFinishEventDetail {
		pageType: string;
		response: {
			playerResponse: {
				videoDetails: YouTube.VideoDetails;
			};
			url: string;
		};
	}
}

(() => {
	const { } = new YouTubePageScript();
})();
