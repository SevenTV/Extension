import React from 'react';
import ReactDOM from 'react-dom';
import { catchError, concatAll, map, toArray } from 'rxjs/operators';
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

@Child
export class App implements Child.OnInjected, Child.OnAppLoaded {
	mainComponent: MainComponent | null = null;

	constructor() { }

	onInjected(): void {
		// Once the extension injected itself into Twitch
		const app = document.createElement('div');
		app.classList.add('seventv-overlay');
		app.style.position = 'absolute';
		app.id = 'seventv';

		const target = document.getElementById('root');
		this.mainComponent = ReactDOM.render(<MainComponent emoteStore={emoteStore} />, app) as unknown as MainComponent;
		this.mainComponent.app = this;

		target?.firstChild?.appendChild(app);

		emitHook('onAppLoaded');
	}

	onAppLoaded(): void {
		// Add emote list button
		const buttons = document.querySelector(Twitch.Selectors.ChatInputButtonsContainer);
		if (!!buttons && !!buttons.lastChild) {
			const last = buttons.lastChild;
			const container = document.createElement('div');
			last.insertBefore(container, last.lastChild ?? null);

			ReactDOM.render(<EmoteMenuButton main={this.mainComponent} />, container);
		}
	}

	@PageScriptListener('SwitchChannel')
	whenTheChannelSwitches(data: { channelName: string; }): void {
		scheduled([
			api.GetChannelEmotes(data.channelName).pipe(catchError(_ => of([]))),
			api.GetGlobalEmotes().pipe(catchError(_ => of([]))),
			api.GetThirdPartyChannelEmotes(data.channelName, ['BTTV', 'FFZ']),
			api.GetThirdPartyGlobalEmotes(['BTTV', 'FFZ'])
		], asapScheduler).pipe(
			concatAll(),
			toArray(),
			map(a => a.reduce((a, b) => a.concat(b))),
			map(e => emoteStore.enableSet(data.channelName, e)),
		).subscribe({
			next: (set: EmoteStore.EmoteSet) => {
				this.sendMessageDown('EnableEmoteSet', set.resolve());
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


const api = new API();
const emoteStore = new EmoteStore();
export const onMessageUnrender = new Subject<string>();
export const onChatScroll = new Subject<void>();
