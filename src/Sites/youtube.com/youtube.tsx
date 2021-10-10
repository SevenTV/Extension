import { asyncScheduler, fromEvent, iif, interval, of, scheduled, Subject, timer } from 'rxjs';
import { filter, map, mapTo, mergeAll, switchMap, take, takeUntil } from 'rxjs/operators';
import { assetStore, SiteApp } from 'src/Sites/app/SiteApp';
import { ChatObserver } from 'src/Sites/youtube.com/Runtime/ChatObserver';
import { YouTube } from 'src/Sites/youtube.com/Util/YouTube';
import { get } from 'superagent';
import { Divisor } from 'src/Sites/youtube.com/Util/Divisor';
import ReactDOM from 'react-dom';
import React from 'react';

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
	isTheaterMode = false;

	constructor() {
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
				const input = this.youtube.getChatInput(this.youtube.getChatFrame() ?? undefined);
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
				this.insertEmoteMenuButton();
				this.addTheaterModeButton();
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
				// Channel ID found: poll for the YT live chat renderer
				switchMap(channelID => interval(500).pipe(
					take(10),
					map(() => document.querySelector<HTMLElement>('yt-live-chat-renderer')),
					map(node => !node ? this.youtube.getChatFrame()?.querySelector<HTMLElement>('yt-live-chat-renderer') : node),
					filter(node => !!node),
					take(1),
					mapTo(channelID)
				)),

				// Activate emotes on the channel
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
	 * Add the emote menu button to the chat
	 */
	insertEmoteMenuButton(): void {
		this.site.embeddedUI.embedChatButton((
			document.querySelector('div#picker-buttons.yt-live-chat-message-input-renderer')?.parentElement ??
			this.youtube.getChatFrame()?.querySelector('div#message-buttons')?.parentElement
		) as HTMLElement);
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
	 * Add a button to toggle the True Theater Mode
	 */
	addTheaterModeButton(): void {
		const controls = document.querySelector('.ytp-right-controls');
		if (!controls) return undefined;
		if (controls.querySelector('.seventv-yt-theater-mode-button')) {
			return undefined;
		}

		const container = document.createElement('div');
		container.classList.add('seventv-yt-theater-mode-button-container');

		const btn = document.createElement('button');
		btn.classList.add('seventv-yt-theater-mode-button', 'ytp-button', 'ytp-size-button');
		btn.setAttribute('title', '[7TV] True Theater Mode');
		btn.setAttribute('aria-label', '[7TV] True Theater Mode');
		container.appendChild(btn);
		const icon = document.createElement('img');
		icon.src = assetStore.get('theater-mode.webp') ?? '';

		btn.appendChild(icon);
		controls.insertBefore(container, controls.lastChild);

		scheduled([
			fromEvent(container, 'click').pipe(
				map(() => this.toggleTheaterMode())
			),
			fromEvent(document, 'keyup').pipe(
				map(ev => ev as KeyboardEvent),
				filter(ev => this.isTheaterMode && ev.code === 'Escape'),
				map(() => this.toggleTheaterMode())
			)
		], asyncScheduler).pipe(
			mergeAll()
		).subscribe();
	}

	/**
	 * Toggle the true theater mode
	 */
	toggleTheaterMode(): void {
		const className = 'seventv-yt-theater-mode';
		const isTheaterMode = document.body.classList.contains(className);
		this.isTheaterMode = !isTheaterMode;

		const chat = document.querySelector('div[id=secondary]') as HTMLElement;

		if (isTheaterMode) {
			document.body.classList.remove(className);

			document.querySelector('.seventv-divisor')?.remove();
			chat!.style.width = 'var(--ytd-watch-flexy-sidebar-width)';

		} else {
			document.body.classList.add(className);

			const container = document.createElement('div');
			container.classList.add('seventv-divisor');

			const changeWidth = (e: number) => {
				chat!.style.width = `${window.innerWidth - e}px`;
			};

			chat?.parentNode?.insertBefore(container, chat);
			ReactDOM.render(<Divisor callback={changeWidth}/>, container);
		}
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
