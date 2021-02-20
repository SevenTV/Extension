import { from, of } from 'rxjs';
import { map, mapTo, filter, concatMap, concatAll, tap } from 'rxjs/operators';
import { Content } from 'src/Content/Content';
import { ChatLine } from 'src/Content/Util/ChatLine';
import { Logger } from 'src/Logger';


export class ChatListener {
	cachedEmotes = new Map<string, JSX.Element>();
	private currentChannel: string;
	private currentObserver: MutationObserver;

	constructor() {
		Content.onMessage.pipe(
			filter(({ tag }) => tag === 'SwitchChannel'),
			map(({ channelName }) => this.setChannel(channelName))
		).subscribe();
	}

	setChannel(channelName: string): void {
		const oldChannel = String(this.currentChannel);
		Logger.Get().info(`Switched to channel ${channelName}`);

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
				// mergeMap(ch => ch.getUsername().pipe(
				// 	switchMap(username => ch.getFragments().pipe(map(fragments => ({ fragments, username })))),
				// 	tap(({ username, fragments }) => console.log(username.innerText + ':', fragments.innerHTML))
				// ))

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
	}
}
