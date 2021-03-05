import { DataStructure } from '@typings/typings/DataStructure';
import { EMPTY, Observable } from 'rxjs';
import { delay, filter, map, tap, toArray } from 'rxjs/operators';
import { Background } from 'src/Background/Background';
import { Config } from 'src/Config';
import { Logger } from 'src/Logger';
import { version as extVersion } from '../../../package.json';

export class NavHandler {
	private versionChecked = false;
	private channelURL = /(https:\/\/www.twitch.tv\/)(?:(popout|moderator)\/)?([a-zA-Z0-9_]{4,25})/;
	private currentChannel: string | null = null;

	constructor() {
		chrome.tabs.onUpdated.addListener((id, change, tab) => this.onUpdate(id, change, tab));
	}

	onContentOK(): void {
		// Make one time request to fetch global emotes
		this.getEmotes('@global').pipe(
			toArray(),
			tap(emotes => Logger.Get().info(`Loaded ${emotes.length} global emotes`)),
			map(emotes => Background.Messaging.send({
				tag: 'MapGlobalEmotes',
				emotes
			}))
		).subscribe({
			error: (err) => Logger.Get().error('Failed to retrieve global emotes', err)
		});
	}

	private onUpdate(id: number, change: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab): void {
		if (!this.channelURL.test(tab.url)) return undefined;
		if (change.status !== 'complete') return undefined;

		// const url = new URL(tab.url.replace('/popout', ''));
		const parsedURL = tab.url.match(this.channelURL);
		const channelName = this.currentChannel = parsedURL[3]; // Index 3 of regex-matched string will always be the channel name
		Logger.Get().info('Navigation to channel', channelName);

		this.getEmotes(channelName).pipe(
			toArray(),
			map(emotes => Background.Messaging.send({
				tag: 'SwitchChannel',
				emotes,
				channelName
			}))
		).subscribe();

		if (!this.versionChecked) {
			this.versionChecked = true;
			// Check version
			this.checkVersion().pipe(
				tap(res => Logger.Get().warn(`Extension is Outdated! Latest release is ${res.version} but this is ${extVersion}`)),
				map(res => {
					Background.Messaging.send({
						tag: 'OutdatedVersion',
						latestVersion: res.version,
						clientVersion: extVersion,

					});
				})
			).subscribe();
		}
	}

	getEmotes(channelName: string | '@global'): Observable<DataStructure.Emote> {
		return new Observable<DataStructure.Emote>(observer => {
			const xhr = new XMLHttpRequest();

			xhr.addEventListener('load', (ev) => {
				const data = JSON.parse(xhr.responseText);
				for (const e of data.emotes) {
					observer.next(e as DataStructure.Emote);
				}

				observer.complete();
			});

			xhr.open('GET', Config.apiUrl + (channelName === '@global' ? `/emotes?globalEmotes=only&pageSize=150` : `/channels/${channelName}/emotes`));
			xhr.send();
		});
	}

	checkVersion(): Observable<NavHandler.CheckVersionResult> {
		return new Observable<NavHandler.CheckVersionResult>(observer => {
			const xhr = new XMLHttpRequest();

			xhr.addEventListener('load', ev => {
				const data = JSON.parse(xhr.responseText);
				if (typeof data.version === 'string') {
					observer.next({
						version: data.version,
						releaseUrl: data.release_url
					});
				}
			});
			xhr.open('GET', `${Config.apiUrl}/extension?type=chrome`);
			xhr.send();
		});
	}
}

export namespace NavHandler {
	export interface CheckVersionResult {
		version: string;
		releaseUrl: string;
	}
}
