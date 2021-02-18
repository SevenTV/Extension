import { from, of, range } from 'rxjs';
import { filter, map, mapTo, mergeAll, mergeMap, tap } from 'rxjs/operators';

console.log('Pag');

const targetNode = document.getElementsByClassName('stream-chat').item(0);
const cb = (mutations: MutationRecord[], observer: MutationObserver) => {
	from(mutations).pipe(
		map(mutation => ({ mutation, nodes: [] as HTMLDivElement[] })),
		mergeMap(({ mutation, nodes }) => of(mutation.addedNodes.forEach((n: any) => nodes.push(n as HTMLDivElement))).pipe(
			mapTo(nodes)
		)),
		mergeAll(),
		filter(el => el.classList?.contains('chat-line__message')),
		map(el => ({ el, fragments: el.getElementsByClassName('text-fragment') })),
		mergeMap(({ el, fragments }) => range(0, fragments.length).pipe(
			map(i => fragments.item(i))
		)),
		
		// do stuff with fragments...
	).subscribe();
};

// Begin observing new elements
const mutationObserver = new MutationObserver(cb);
mutationObserver.observe(targetNode, {
	attributes: true, childList: true, subtree: true
});
