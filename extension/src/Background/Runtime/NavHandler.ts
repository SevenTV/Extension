import { Background } from 'src/Background/Background';
import { Logger } from 'src/Logger';

export class NavHandler {
	private channelURL = /(https:\/\/www.twitch.tv\/)([a-zA-Z0-9_]{4,25}$)/;

	constructor() {
		chrome.tabs.onUpdated.addListener((id, change, tab) => this.onUpdate(id, change, tab));

	}

	private onUpdate(id: number, change: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab): void {
		if (!this.channelURL.test(tab.url)) return undefined;
		console.log(change, tab.url);
		if (change.status !== 'complete') return undefined;

		const url = new URL(tab.url);
		Logger.Get().info('Navigation to', url.pathname);

		Background.Messaging.send({
			tag: 'SwitchChannel',
			channelName: url.pathname.slice(1)
		});
	}
}
