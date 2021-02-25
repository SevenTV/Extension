import { DataStructure } from '@typings/DataStructure';
import { Observable } from 'rxjs';
import { map, toArray } from 'rxjs/operators';
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

		this.getEmotes().pipe(
			toArray(),
			map(emotes => Background.Messaging.send({
				tag: 'SwitchChannel',
				emotes,
				channelName: url.pathname.slice(1)
			}))
		).subscribe();
	}


	getEmotes(): Observable<DataStructure.Emote> {
		return new Observable<DataStructure.Emote>(observer => {
			const xhr = new XMLHttpRequest();

			xhr.addEventListener('load', (ev) => {
				const data = JSON.parse(xhr.responseText);
				for (const e of data) {
					observer.next(e as DataStructure.Emote);
				}

				observer.complete();
			});
			xhr.open('GET', 'http://localhost:3000/emotes/AnatoleAM');
			xhr.send();
		});
	}
}
