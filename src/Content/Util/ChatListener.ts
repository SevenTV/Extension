import { from, Observable, of } from 'rxjs';
import { map, mapTo, filter, concatMap, concatAll, tap, mergeMap, toArray, switchMap, mergeAll } from 'rxjs/operators';
import { DataStructure } from '@typings/typings/DataStructure';
import { Content } from 'src/Content/Content';
import { ChatLine } from 'src/Content/Util/ChatLine';
import { Logger } from 'src/Logger';


export class ChatListener {
	globalEmotes = [] as DataStructure.Emote[];
	cachedEmotes = new Map<string, JSX.Element>();
	private currentChannel: string;
	private currentObserver: MutationObserver;

	constructor() {
		// Handle channel switch
		Content.onMessage.pipe(
			filter(({ tag }) => tag === 'SwitchChannel'),
			map(({ channelName, emotes }) => this.setChannel(channelName, emotes)),
		).subscribe();

		// Receive global emotes
		Content.onMessage.pipe(
			filter(({ tag }) => tag === 'MapGlobalEmotes'),
			map(({ emotes }) => emotes as DataStructure.Emote[]),
			tap(emotes => Logger.Get().info(`Loaded ${emotes.length} global emotes`)),
			tap(emotes => this.globalEmotes = emotes)
		).subscribe();

		// Notify user of version mismatch
		Content.onMessage.pipe(
			filter(({ tag }) => tag === 'OutdatedVersion'),
			map(msg => ChatLine.postStatus(''.concat(
				'SevenTV is outdated! ',
				`You are running version ${msg.clientVersion} but the latest is ${msg.latestVersion}. `,
				`<a target="_blank" href="https://github.com/SevenTV/SevenTV/releases">Get the latest release</a>`
			)))
		).subscribe();
	}

	setChannel(channelName: string, emotes: DataStructure.Emote[]): void {
		const oldChannel = String(this.currentChannel);
		Logger.Get().info(`Switched to channel ${channelName}`);

		const allEmotes = [...emotes, ...this.globalEmotes];
		const targetNode = document.getElementsByClassName('stream-chat').item(0);
		const cb = (mutations: MutationRecord[], observer: MutationObserver) => {
			from(mutations).pipe(
				map(mutation => ({ mutation, nodes: [] as HTMLDivElement[] })),
				concatMap(({ mutation, nodes }) => of(mutation.addedNodes.forEach((n: any) => nodes.push(n as HTMLDivElement))).pipe(
					mapTo(nodes)
				)),
				concatAll(),
				filter(el => el.classList?.contains('chat-line__message')),
				map(el => new ChatLine(this, el)),
				map(line => line.renderEmote(allEmotes))

				// do stuff with fragments...
			).subscribe();
		};

		// Stop old observer if it exists
		if (this.currentObserver) {
			Logger.Get().info(`Stopped observer for previous channel ${oldChannel}`);
			this.currentObserver.disconnect();
		}

		// Create new MutationObserver
		const mutationObserver = this.currentObserver = new MutationObserver(cb);
		mutationObserver.observe(targetNode, {
			attributes: true, childList: true, subtree: true
		});

		this.currentChannel = channelName;
		ChatLine.postStatus(`SevenTV is enabled, found ${emotes.length} emotes in ${channelName} and ${this.globalEmotes.length} global emotes`);
	}
}
