import React from 'react';
import ReactDOM from 'react-dom';
import { catchError, filter, map, mergeAll, switchMap, tap, toArray } from 'rxjs/operators';
import { MainComponent } from 'src/Content/Components/MainComponent';
import { Child, PageScriptListener } from 'src/Global/Decorators';
import { emitHook } from 'src/Content/Global/Hooks';
import { MessageRenderer } from 'src/Content/Runtime/MessageRenderer';
import { API } from 'src/Global/API';
import { EmoteStore } from 'src/Global/EmoteStore';
import { asapScheduler, defer, from, iif, of, scheduled, Subject, throwError } from 'rxjs';
import { Logger } from 'src/Logger';
import { Twitch } from 'src/Page/Util/Twitch';
import { TabCompleteDetection } from 'src/Content/Runtime/TabCompleteDetection';
import { DataStructure } from '@typings/typings/DataStructure';
import { Badge } from 'src/Global/Badge';
import { ExtensionContentScript } from 'src/Content/Content';
import { Constants } from '@typings/src/Constants';
import { settings } from 'src/Content/Runtime/Settings';
import { EmbeddedUI } from 'src/Content/Runtime/EmbeddedUI';

@Child
export class App implements Child.OnInjected, Child.OnAppLoaded {
	mainComponent: MainComponent | null = null;
	emoteStore = emoteStore;
	badges = badges;
	badgeMap = badgeMap;
	embeddedUI: EmbeddedUI | null = null;

	constructor() {
		app = this;

		// Channel Emotes Update: the current channel's emotes are updated
		api.events.emoteEvent.pipe(
			filter(event => event.channel === state.channel)
		).subscribe({
			next: event => {
				const action = event.action;
				const set = emoteStore.sets.get(state.channel);
				if (!set) {
					return;
				}

				switch (action) {
					case 'ADD':
						this.sendMessageDown('SendSystemMessage', `${event.actor} added the emote "${event.emote.name}"`);
						set.push([{ ...event.emote, id: event.emote_id }], false);
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

				tabCompleteDetector?.updateEmotes();
				this.sendMessageDown('EnableEmoteSet', set.resolve());
				this.sendMessageDown('ChannelEmoteChange', event);
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

		// Handle config changes
		settings.change.subscribe({
			next: change => this.sendMessageDown('ConfigChange', change)
		});
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
		this.embeddedUI = embeddedUI = new EmbeddedUI(this);

		target?.firstChild?.appendChild(app);

		this.sendMessageDown('ConfigChange', settings.raw);
		emitHook('onAppLoaded');
	}

	onAppLoaded(): void { }

	@PageScriptListener('SwitchChannel')
	whenTheChannelSwitches(data: {
		channelID: string;
		channelLogin: string;
		as: string;
		skip_download: boolean;
		emotes: DataStructure.Emote[];
	}): void {
		emoteStore.disableSet(state.channel);
		emoteStore.disableSet(data.as);
		mainComponent?.toggleEmoteMenu(undefined, false);
		this.sendMessageDown('DisableEmoteSet', state.channel);
		this.sendMessageDown('DisableEmoteSet', data.as);

		// Remove current channel from event subscriptions
		if (state.channel?.length > 0) {
			api.events.removeChannel(state.channel);
		}

		const afterLoaded = () => {
			if (!tabCompleteDetector) {
				tabCompleteDetector = new TabCompleteDetection(app as App);
			} else {
				tabCompleteDetector.stop();
			}

			tabCompleteDetector.updateEmotes();
			tabCompleteDetector.start();
			api.events.addChannel(state.channel);
			embeddedUI?.embedChatButton();
		};

		const emoteGetter = [
			api.GetChannelEmotes(data.channelID).pipe(catchError(_ => of([]))),
			api.GetGlobalEmotes().pipe(catchError(_ => of([]))),
			api.GetFrankerFaceZChannelEmotes(data.channelID).pipe(
				catchError(err => defer(() => app?.sendMessageDown('SendSystemMessage', `Failed to load FrankerFaceZ channel emotes: ${err.message}`)))
			),
			api.GetFrankerFaceZGlobalEmotes().pipe(
				catchError(err => defer(() => app?.sendMessageDown('SendSystemMessage', `Failed to load FrankerFaceZ global emotes: ${err.message}`)))
			),
			api.GetBTTVChannelEmotes(data.channelID).pipe(
				catchError(err => defer(() => app?.sendMessageDown('SendSystemMessage', `Failed to load BetterTTV channel emotes: ${err.message}`)))
			),
			api.GetBTTVGlobalEmotes().pipe(
				catchError(err => defer(() => app?.sendMessageDown('SendSystemMessage', `Failed to load BetterTTV global emotes: ${err.message}`)))
			)
		];

		scheduled(emoteGetter, asapScheduler).pipe(
			mergeAll(),
			toArray(),
			map(a => a.reduce((a, b) => a.concat(b as any))),
			switchMap(e => iif(() => e.length === 0,
				throwError(Error(`7TV failed to load (perhaps service is down?)`)),
				of(e)
			)),
			map(e => emoteStore.enableSet(data.channelID, e)),
		).subscribe({
			next: (set: EmoteStore.EmoteSet) => {
				state.channel = data.channelID;
				this.sendMessageDown('EnableEmoteSet', set.resolve());
				afterLoaded();
			},
			error(err) {
				Logger.Get().error(`Failed to fetch current channel's emote set (${err}), the extension will be disabled`);
				app?.sendMessageDown('SendSystemMessage', `Error: ${err.message}`);
			}
		});
	}

	@PageScriptListener('RenderChatLine')
	whenAChatLineIsRendered(data: { msg: Twitch.ChatMessage; elementId: string; }): void {
		const renderer = new MessageRenderer(app as App, data.msg, data.elementId);

		renderer.renderMessageTree();
		renderer.insert();
		tabCompleteDetector?.addChatter(data.msg.user.displayName ?? data.msg.user.userDisplayName);
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
	 * Receive twitch emotes from the page layer and create our emote sets for them,
	 * @param emoteSets the twitch emote sets
	 */
	@PageScriptListener('ReceiveTwitchEmotes')
	whenWhenTwitchEmotesWhenEmotesTwitchOkayge(emoteSets: Twitch.TwitchEmoteSet[]): void {
		// Iterate through sets, and start adding to our twitch set
		const emotes = [] as DataStructure.Emote[];
		for (const twset of emoteSets) {
			for (const emote of twset.emotes) {
				emotes.push({
					id: emote.id,
					name: emote.token,
					visibility: 0,
					provider: 'TWITCH',
					status: Constants.Emotes.Status.LIVE,
					tags: [],
					width: [28, 56, 112, 112],
					height: [28, 56, 112, 112],
					owner: !!twset.owner ? {
						id: twset.owner.id,
						display_name: twset.owner.displayName,
						login: twset.owner.login
					} as DataStructure.TwitchUser : undefined
				});
			}
		}

		// Delete the twitch set if it already existed then recreate it
		if (emoteStore.sets.has('twitch')) {
			emoteStore.sets.delete('twitch');
		}
		emoteStore.enableSet(`twitch`, emotes);
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
let embeddedUI: EmbeddedUI | null = null;
const api = new API();
const emoteStore = new EmoteStore();
const badges = [] as Badge[];
const badgeMap = new Map<number, number[]>();
export const onMessageUnrender = new Subject<string>();
export const onChatScroll = new Subject<void>();
