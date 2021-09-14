import { Subject, timer } from 'rxjs';
import { filter, map, skip, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { SiteApp } from 'src/Sites/app/SiteApp';
import { ChatObserver } from 'src/Sites/youtube.com/Runtime/ChatObserver';
import { YouTube } from 'src/Sites/youtube.com/Util/YouTube';

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
		let currentLocation = document.location.href;
		setInterval(() => {
			if (currentLocation !== document.location.href) {
				currentLocation = document.location.href;
				this.handleNavigationChange(currentLocation);
			}
		}, 500);

		setTimeout(() => {
			this.handleNavigationChange(document.location.href);
		}, 1000);
	}

	handleNavigationChange(url: string): void {
		this.navChange.next(url);

		// Find the current channel
		if (!!window.yt) {
			const found = new Subject<boolean>();
			timer(0, 500).pipe(
				takeUntil(found),
				takeUntil(this.navChange.pipe(skip(1))),
				map(() =>
					window.yt?.config_?.CHANNEL_ID ??
					window.ytplayer?.bootstrapPlayerResponse?.videoDetails?.channelId ??
					window.ytInitialData?.metadata?.channelMetadataRenderer?.externalId ??
					window.ytInitialPlayerResponse?.videoDetails?.channelId ??
					this.getCurrentChannelID()
				),
				take(10),
				filter(v => typeof v === 'string' && v !== ''),
				take(1),
				switchMap(channelID => this.site.switchChannel({ channelID: channelID, platform: 'youtube' })),
				tap(() => {
					found.next(true);
					found.complete();
					this.site.eIndex = null;
					this.chatObserver.rerenderAll();
					this.chatObserver.listen();
					this.setupOverlay();
				})
			).subscribe();
		}
	}

	setupOverlay(): void {
		if (!!document.querySelector('.seventv-overlay')) {
			return undefined;
		}
		// Create Overlay
		const overlayContainer =
			this.youtube.getChatFrame()?.document?.body?.querySelector('yt-live-chat-app') as HTMLElement ??
			document.getElementById('body-container') ??
			document.getElementById('content');
		if (!!overlayContainer) {
			this.site.createOverlay(overlayContainer);
		}
	}

	getCurrentChannelID(): string {
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
}

(() => {
	const { } = new YouTubePageScript();
})();
