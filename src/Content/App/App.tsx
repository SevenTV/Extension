import React from 'react';
import ReactDOM from 'react-dom';
import { catchError, concatAll, map, switchMap, tap, toArray } from 'rxjs/operators';
import { MainComponent } from 'src/Content/Components/MainComponent';
import { Child, PageScriptListener } from 'src/Global/Decorators';
import { emitHook } from 'src/Content/Global/Hooks';
import { MessageRenderer } from 'src/Content/Runtime/MessageRenderer';
import { API } from 'src/Global/API';
import { EmoteStore } from 'src/Global/EmoteStore';
import { asapScheduler, from, of, scheduled, Subject } from 'rxjs';
import { Logger } from 'src/Logger';
import { Twitch } from 'src/Page/Util/Twitch';
import { EmoteMenuButton } from 'src/Content/Components/EmoteMenu/EmoteMenuButton';
import { TabCompleteDetection } from 'src/Content/Runtime/TabCompleteDetection';
import { DataStructure } from '@typings/typings/DataStructure';
import { Badge } from 'src/Global/Badge';
import { ExtensionContentScript } from 'src/Content/Content';

@Child
export class App implements Child.OnInjected, Child.OnAppLoaded {
	mainComponent: MainComponent | null = null;
	emoteStore = emoteStore;
	badges = badges;
	badgeMap = badgeMap;

	constructor() {
		app = this;

		// Channel Emotes Update: the current channel's emotes are updated
		api.events.emoteEvent.subscribe({
			next: event => {
				const action = event.action;
				const set = emoteStore.sets.get(state.channel);
				if (!set) {
					return;
				}

				switch (action) {
					case 'ADD':
						this.sendMessageDown('SendSystemMessage', `${event.actor} added the emote "${event.emote.name}"`);
						set.push([event.emote], false);
						break;
					case 'REMOVE':
						this.sendMessageDown('SendSystemMessage', `${event.actor} removed the emote "${event.name}"`);
						set.deleteEmote(event.emote_id);
						break;
					case 'UPDATE':
						const emote = set.getEmoteByID(event.emote_id);
						if (!emote) {
							break;
						}
						const oldName = String(emote.name);

						emote.setName(event.name);
						set.deleteEmote(event.emote_id);
						set.push([emote.resolve()], false);
						this.sendMessageDown('SendSystemMessage', `${event.actor} renamed the emote "${oldName}" to "${event.name}"`);
						break;
					default:
						break;
				}

				this.sendMessageDown('EnableEmoteSet', set.resolve());
			}
		});
		ExtensionContentScript.destroyed.subscribe({
			complete: () => api.events.removeChannel(state.channel)
		});

		// Fetch Badges
		api.GetBadges().pipe(
			switchMap(badges => from(badges)),
			map((badge, i) => {
				this.badges[i] = badge;
				for (const u of badge.users) {
					let id: number | string = parseInt(u);
					if (isNaN(id)) {
						id = u;
					}

					if (this.badgeMap.has(id as number)) {
						this.badgeMap.set(id as number, [...this.badgeMap.get(id as number) as number[], i]);
					} else {
						this.badgeMap.set(id as number, [i]);
					}
				}
				return badge;
			}),
			toArray(),
			tap(badges => Logger.Get().info(`Loaded ${badges.length} badges`))
		).subscribe();
	}

	onInjected(): void {
		// Once the extension injected itself into Twitch
		const app = document.createElement('div');
		app.classList.add('seventv-overlay');
		app.style.position = 'absolute';
		app.id = 'seventv';

		const target = document.getElementById('root');
		this.mainComponent = mainComponent = ReactDOM.render(<MainComponent emoteStore={emoteStore} />, app) as unknown as MainComponent;
		this.mainComponent.app = this;

		target?.firstChild?.appendChild(app);

		emitHook('onAppLoaded');
	}

	onAppLoaded(): void { }

	@PageScriptListener('SwitchChannel')
	whenTheChannelSwitches(data: {
		channelName: string; as: string;
		skip_download: boolean;
		emotes: DataStructure.Emote[];
	}): void {
		emoteStore.disableSet(state.channel);
		emoteStore.disableSet(data.as);
		mainComponent?.toggleEmoteMenu(undefined, false);
		this.sendMessageDown('DisableEmoteSet', state.channel);
		this.sendMessageDown('DisableEmoteSet', data.as);

		const afterLoaded = () => {
			if (!tabCompleteDetector) {
				tabCompleteDetector = new TabCompleteDetection(app as App);
			} else {
				tabCompleteDetector.stop();
			}

			tabCompleteDetector.updateEmotes();
			tabCompleteDetector.start();
			api.events.addChannel(state.channel);
			insertEmoteButton();
		};

		const emoteGetter = [
			api.GetChannelEmotes(data.channelName, ['BTTV', 'FFZ']).pipe(catchError(_ => of([]))),
			api.GetGlobalEmotes(['BTTV', 'FFZ']).pipe(catchError(_ => of([])))
		];
		if (data.skip_download) {
			state.channel = data.channelName;

			scheduled(emoteGetter, asapScheduler).pipe(
				concatAll(),
				toArray(),
				map(emotes => emoteStore.enableSet(data.channelName, [...data.emotes, ...emotes[0], ...emotes[1]])),
				tap(() => afterLoaded())
			).subscribe({
				error(err) {
					Logger.Get().error(`Failed to fetch third-party emotes (${err})`);
				}
			});

			return undefined;
		}

		scheduled(emoteGetter, asapScheduler).pipe(
			concatAll(),
			toArray(),
			map(a => a.reduce((a, b) => a.concat(b as any))),
			map(e => emoteStore.enableSet(data.channelName, e)),
		).subscribe({
			next: (set: EmoteStore.EmoteSet) => {
				state.channel = data.channelName;
				this.sendMessageDown('EnableEmoteSet', set.resolve());
				afterLoaded();
			},
			error(err) {
				Logger.Get().error(`Failed to fetch current channel's emote set (${err}), the extension will be disabled`);
			}
		});
	}

	@PageScriptListener('RenderChatLine')
	whenAChatLineIsRendered(data: { msg: Twitch.ChatMessage; elementId: string; }): void {
		const renderer = new MessageRenderer(app as App, data.msg, data.elementId);

		renderer.renderMessageTree();
		renderer.insert();
	}

	@PageScriptListener('UnrenderChatLine')
	whenAChatLineIsUnrendered(data: { id: string; }): void {
		onMessageUnrender.next(data.id);
	}

	@PageScriptListener('ScrollChat')
	whenTheChatIsScrolledByUser() {
		onChatScroll.next(undefined);
	}

	/**
	 * Synchronize the emote sets with the pagescript
	 */
	sync(): void {
		this.sendMessageDown('SyncEmoteStore', emoteStore.resolve());
	}

	/**
	 * Send a message to the page script layer
	 *
	 * @param tag the event tag
	 * @param data the event data
	 */
	sendMessageDown(tag: string, data: any): void {
		window.dispatchEvent(new CustomEvent(`7TV#${tag}`, { detail: JSON.stringify(data) }));
	}

	get emotes() {
		return emoteStore;
	}
}

const state = {
	channel: ''
};

let app: App | null = null;
let mainComponent: MainComponent | undefined;
let tabCompleteDetector: TabCompleteDetection | null = null;
const api = new API();
const emoteStore = new EmoteStore();
const badges = [] as Badge[];
const badgeMap = new Map<number, number[]>();
export const onMessageUnrender = new Subject<string>();
export const onChatScroll = new Subject<void>();

export const insertEmoteButton = (): void => {
	// Add emote list button
	const buttons = document.querySelector(Twitch.Selectors.ChatInputButtonsContainer);
	if (!!buttons && !!buttons.lastChild) {
		if (buttons.querySelector('.seventv-emote-menu-button')) {
			return undefined;
		}

		const last = buttons.lastChild;
		const container = document.createElement('div');
		container.classList.add('seventv-emote-menu-button');

		last.insertBefore(container, last.lastChild ?? null);

		if (!!app) {
			ReactDOM.render(<EmoteMenuButton main={app.mainComponent} />, container);
		}
	}
};
