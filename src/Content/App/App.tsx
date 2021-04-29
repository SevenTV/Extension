import React from 'react';
import ReactDOM from 'react-dom';
import { map, tap } from 'rxjs/operators';
import { MainComponent } from 'src/Content/Components/MainComponent';
import { Child, PageScriptListener } from 'src/Global/Decorators';
import { emitHook } from 'src/Content/Global/Hooks';
import { MessageRenderer } from 'src/Content/Runtime/MessageRenderer';
import { API } from 'src/Global/API';
import { EmoteStore } from 'src/Global/EmoteStore';

@Child
export class App implements Child.OnInjected, Child.OnAppLoaded {
	constructor() { }

	onInjected(): void {
		// Once the extension injected itself into Twitch
		const app = document.createElement('div');
		app.classList.add('seventv-overlay');
		app.style.position = 'absolute';
		app.id = 'seventv';

		const target = document.getElementById('root');
		ReactDOM.render(<MainComponent />, app);

		target?.firstChild?.appendChild(app);

		emitHook('onAppLoaded');
	}

	onAppLoaded(): void {
		console.log('APP IS LOADED');
	}

	@PageScriptListener('SwitchChannel')
	whenTheChannelSwitches(data: { channelName: string; }): void {
		api.GetChannelEmotes(data.channelName).pipe(
			map(e => emoteStore.enableSet(data.channelName, e)),

			map(emotes => {
				this.sendMessageDown('EnableEmoteSet', emotes.resolve());
			})
		).subscribe();
	}

	@PageScriptListener('RenderChatLine')
	whenAChatLineIsRendered(data: { msg: any; elementId: string; }): void {
		const renderer = new MessageRenderer(this, data.msg, data.elementId);

		renderer.renderMessageTree();
		renderer.insert();
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
