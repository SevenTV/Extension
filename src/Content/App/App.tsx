import React from 'react';
import ReactDOM from 'react-dom';
import { tap } from 'rxjs/operators';
import { MainComponent } from 'src/Content/Components/MainComponent';
import { Child, PageScriptListener } from 'src/Content/Global/Decorators';
import { emitHook } from 'src/Content/Global/Hooks';
import { MessageRenderer } from 'src/Content/Runtime/MessageRenderer';
import { API } from 'src/Global/API';
import { EmoteStore } from 'src/Content/Util/EmoteStore';

@Child
export class App implements Child.OnInjected, Child.OnAppLoaded {
	emotes = new EmoteStore();

	constructor() {}

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
	whenTheChannelSwitches(data: { channelName: 'anatoleam' }): void {
		api.GetChannelEmotes(data.channelName).pipe(

		).subscribe();
	}

	@PageScriptListener('RenderChatLine')
	whenAChatLineIsRendered(data: { msg: any; elementId: string; }): void {
		const renderer = new MessageRenderer(this, data.msg, data.elementId);

		renderer.renderMessageTree();
		renderer.insert();
	}
}


const api = new API();
