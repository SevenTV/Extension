import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Subject } from 'rxjs';
import { bufferToggle, bufferWhen, filter, mergeAll, tap } from 'rxjs/operators';
import { Logger } from 'src/Logger';
import styled from 'styled-components';

class Main extends React.Component {
	render() {
		return (
			<Main.Style>

			</Main.Style>
		);
	}
}

namespace Main {
	export const Style = styled.div``;
}

const app = document.createElement('div');
app.id = 'seventv';
document.body.appendChild(app);
ReactDOM.render(<Main />, app);

export const Content = {
	onMessage: new Subject<any>(),
	PageReady: new Subject<void>()
};

// Listen for messages from background
// Forward them to page
let pageReady = false;
const bufferedPageEvents = [] as CustomEvent[];
chrome.runtime.onMessage.addListener(msg => {
	const ev = new CustomEvent(`7TV#BackgroundExtMessage`, { detail: msg });
	pageReady ?	window.dispatchEvent(ev) : bufferedPageEvents.push(ev);

	return true;
});

// Listen to page becoming ready
window.addEventListener('7TV#PageScriptReady', () => {
	pageReady = true;
	for (const ev of bufferedPageEvents) {
		window.dispatchEvent(ev);
	}
});

Logger.Get().info('Extension active!');

window.onbeforeunload = () => chrome.runtime.sendMessage({
	tag: 'Unload'
});

// import('src/Content/Util/Twitch');

{
	const script = document.createElement('script');
	script.src = chrome.runtime.getURL('page.js');
	script.onload = () => {
		Logger.Get().info('Injected into Twitch');
	};

	(document.head ?? document.documentElement).appendChild(script);
}
