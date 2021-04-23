import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Subject } from 'rxjs';
import { MainComponent as Main } from 'src/Content/Components/MainComponent';
import { MessageRenderer } from 'src/Content/Runtime/MessageRenderer';
import { EmoteStore } from 'src/Content/Util/EmoteStore';
import { Logger } from 'src/Logger';
import 'src/Style/Style.scss';

export const Content = {
	onMessage: new Subject<any>(),
	PageReady: new Subject<void>(),
	EmoteStore: new EmoteStore()
};

const onInjected = () => {
	const app = document.createElement('div');
	app.classList.add('seventv-overlay');
	app.style.position = 'absolute';
	app.id = 'seventv';

	const target = document.getElementById('root');
	ReactDOM.render(<Main />, app);

	target?.firstChild?.appendChild(app);
};

{
	const script = document.createElement('script');
	const style = document.createElement('link');
	style.rel = 'stylesheet';
	style.type = 'text/css';
	style.href = chrome.runtime.getURL('styles/Style.css');
	script.src = chrome.runtime.getURL('page.js');
	script.onload = () => {
		Logger.Get().info('Injected into Twitch');

		onInjected();
	};

	(document.head ?? document.documentElement).appendChild(script);
	(document.head ?? document.documentElement).appendChild(style);
	console.log(style);
}


window.onbeforeunload = () => chrome.runtime.sendMessage({
	tag: 'Unload'
});

Logger.Get().info('Extension is loading up!');

// Listen for messages from background
// Forward them to page
let pageReady = false;
const bufferedPageEvents = [] as CustomEvent[];
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
	const ev = new CustomEvent(`7TV#BackgroundExtMessage`, { detail: msg });
	pageReady ? window.dispatchEvent(ev) : bufferedPageEvents.push(ev);

	sendResponse(true);
});

// Listen to page becoming ready
window.addEventListener('7TV#PageScriptReady', () => {
	pageReady = true;
	for (const ev of bufferedPageEvents) {
		window.dispatchEvent(ev);
	}
});

window.addEventListener('7TV#RenderChatLine', event => {
	if (!(event instanceof CustomEvent)) return undefined;
	const ev = event as CustomEvent;
	const data = JSON.parse(ev.detail);

	const renderer = new MessageRenderer(data.msg, data.elementId);

	renderer.renderMessageTree();
	renderer.insert();

});
