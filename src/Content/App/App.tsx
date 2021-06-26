import React from 'react';
import ReactDOM from 'react-dom';
import { catchError, concatAll, filter, map, switchMap, take, toArray } from 'rxjs/operators';
import { MainComponent } from 'src/Content/Components/MainComponent';
import { Child, PageScriptListener } from 'src/Global/Decorators';
import { emitHook } from 'src/Content/Global/Hooks';
import { MessageRenderer } from 'src/Content/Runtime/MessageRenderer';
import { API } from 'src/Global/API';
import { EmoteStore } from 'src/Global/EmoteStore';
import { asapScheduler, of, scheduled, Subject } from 'rxjs';
import { Logger } from 'src/Logger';
import { Twitch } from 'src/Page/Util/Twitch';
import { EmoteMenuButton } from 'src/Content/Components/EmoteMenu/EmoteMenuButton';
import { WebSocketAPI } from 'src/Global/WebSocket/WebSocket';

@Child
export class App implements Child.OnInjected, Child.OnAppLoaded {
	mainComponent: MainComponent | null = null;

	constructor() {
		app = this;

		// Listen for websocket dispatches
		// Channel Emotes Update: the current channel's emotes are updated
		api.ws.dispatch.pipe(
			filter(msg => msg.t === 'CHANNEL_EMOTES_UPDATE' && msg.d.channel === state.channel),
		).subscribe({
			next: async (msg: WebSocketAPI.Message<WebSocketAPI.MessageData.DispatchChannelEmotesUpdate>) => {
				this.sendMessageDown('ChannelEmoteChange', msg.d);

				const set = emoteStore.sets.get(state.channel);
				if (!set) {
					return;
				}

				// Remove deleted emotes from set
				if (msg.d.removed) {
					const emote = set.getEmoteByID(msg.d.emote.id);

					this.sendMessageDown('SendSystemMessage', `${msg.d.actor} removed the emote "${emote?.name}"`);
					set.deleteEmote(msg.d.emote.id);
				} else {
					set.push([msg.d.emote], false);
					this.sendMessageDown('SendSystemMessage', `${msg.d.actor} added the emote "${msg.d.emote?.name}"`);
				}

				this.sendMessageDown('EnableEmoteSet', set.resolve());
			}
		});

		api.ws.closed.pipe(
			filter(c => c === true),
			switchMap(() => api.ws.opened.pipe(filter(o => o === true), take(1)))
		).subscribe({
			next: () => {
				api.ws.send('SUBSCRIBE', {
					type: 1,
					params: {
						channel: state.channel
					}
				});
			}
		});
		api.ws.create();
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
	whenTheChannelSwitches(data: { channelName: string; as: string; skip_download: boolean; }): void {
		emoteStore.disableSet(state.channel);
		emoteStore.disableSet(data.as);
		mainComponent?.toggleEmoteMenu(undefined, false);
		this.sendMessageDown('DisableEmoteSet', state.channel);
		this.sendMessageDown('DisableEmoteSet', data.as);

		const updateWS = () => {
			api.ws.send('SUBSCRIBE', {
				type: 1,
				params: {
					channel: state.channel
				}
			});
		};

		if (data.skip_download) {
			updateWS();
			state.channel = data.channelName;

			return undefined;
		}

		insertEmoteButton();
		scheduled([
			api.GetChannelEmotes(data.channelName).pipe(catchError(_ => of([]))),
			api.GetGlobalEmotes().pipe(catchError(_ => of([]))),
			api.GetThirdPartyChannelEmotes(data.channelName, ['BTTV']),
			api.GetThirdPartyGlobalEmotes(['BTTV'])
		], asapScheduler).pipe(
			concatAll(),
			toArray(),
			map(a => a.reduce((a, b) => a.concat(b))),
			map(e => emoteStore.enableSet(data.channelName, e)),
		).subscribe({
			next: (set: EmoteStore.EmoteSet) => {
				state.channel = data.channelName;
				this.sendMessageDown('EnableEmoteSet', set.resolve());

				updateWS();
			},
			error(err) {
				Logger.Get().error(`Failed to fetch current channel's emote set (${err}), the extension will be disabled`);
			}
		});
	}

	@PageScriptListener('RenderChatLine')
	whenAChatLineIsRendered(data: { msg: Twitch.ChatMessage; elementId: string; }): void {
		const renderer = new MessageRenderer(this, data.msg, data.elementId);

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
const api = new API();
const emoteStore = new EmoteStore();
export const onMessageUnrender = new Subject<string>();
export const onChatScroll = new Subject<void>();

export const insertEmoteButton = (): void => {
	// Add emote list button
	const buttons = document.querySelector(Twitch.Selectors.ChatInputButtonsContainer);
	if (!!buttons && !!buttons.lastChild) {
		const last = buttons.lastChild;
		const container = document.createElement('div');
		container.classList.add('seventv-emote-menu-button');

		last.insertBefore(container, last.lastChild ?? null);

		if (!!app) {
			ReactDOM.render(<EmoteMenuButton main={app.mainComponent} />, container);
		}
	}
};

export const unloadEmoteButton = () => {
	const buttons = document.querySelector(Twitch.Selectors.ChatInputButtonsContainer);
	if (!!buttons) {
		const btn = buttons.querySelector('.seventv-emote-menu-button');
		if (!btn) return undefined;

		btn.remove();
	}
};
