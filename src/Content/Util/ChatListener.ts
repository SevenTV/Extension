import { from, Observable, of } from 'rxjs';
import { map, mapTo, filter, concatMap, concatAll, tap, mergeMap, toArray, switchMap, mergeAll } from 'rxjs/operators';
import { DataStructure } from '@typings/typings/DataStructure';
import { Content } from 'src/Content/Content';
import { ChatLine } from 'src/Content/Util/ChatLine';
import { Logger } from 'src/Logger';


export class ChatListener {
	globalEmotes = [] as DataStructure.Emote[];
	cachedEmotes = new Map<string, JSX.Element>();
	private currentObserver: MutationObserver | undefined;

	constructor() {
		// Handle channel switch
		Content.onMessage.pipe(
			filter(({ tag }) => tag === 'LoadChannel'),
			map(({ channelName, emotes }) => this.loadChannel(channelName, emotes)),
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
				'7TV is outdated! ',
				`You are running version ${msg.clientVersion} but the latest is ${msg.latestVersion}. `,
				`<a target="_blank" href="https://github.com/SevenTV/SevenTV/releases">Get the latest release</a>`
			)))
		).subscribe();
	}

	loadChannel(channelName: string, emotes: DataStructure.Emote[]): void {
		Logger.Get().info(`Loaded channel ${channelName}`);

		// Combine global & channel emotes
		const allEmotes = [...emotes, ...this.globalEmotes];
		const targetNode = document.getElementsByClassName('stream-chat').item(0);
		if (!targetNode) return undefined;

		// Receive mutations
		const cb = (mutations: MutationRecord[], observer: MutationObserver) => {
			from(mutations).pipe(
				map(mutation => ({ mutation, nodes: [] as HTMLDivElement[] })), // Get added nodes only
				concatMap(({ mutation, nodes }) => of(mutation.addedNodes.forEach((n: any) => nodes.push(n as HTMLDivElement))).pipe(
					mapTo(nodes)
				)),
				concatAll(), // Stream elements in order
				filter(el => el.classList?.contains('chat-line__message')),
				map(el => new ChatLine(this, el)), // Serialize the chatline & render emotes
				map(line => line.renderEmote(allEmotes))
			).subscribe();
		};

		// Create new MutationObserver
		const mutationObserver = this.currentObserver = new MutationObserver(cb);
		mutationObserver.observe(targetNode, {
			attributes: true, childList: true, subtree: true
		});

		ChatLine.postStatus(`7TV is active, found ${emotes.length} emotes in ${channelName} and ${this.globalEmotes.length} global emotes`);
	}
}
