import { from, of } from "rxjs";
import { map, mapTo, filter, concatMap, concatAll } from "rxjs/operators";
import { ChatLine } from './ChatLine';


export class ChatListener {
	cachedEmotes = new Map<string, string>();

	constructor() {

	}

	start(): void {
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

				map(ch => ch.renderEmote('PagMan'))

				// do stuff with fragments...
			).subscribe();
		};

		// Begin observing new elements
		const mutationObserver = new MutationObserver(cb);
		mutationObserver.observe(targetNode, {
			attributes: true, childList: true, subtree: true
		});

	}
}
