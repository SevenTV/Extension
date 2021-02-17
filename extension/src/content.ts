

setTimeout(() => {
	console.log('Pag');

	const targetNode = document.getElementsByClassName('stream-chat').item(0);
	const cb = (mutations: MutationRecord[], observer: MutationObserver) => {
		for (const node of mutations) {
			node.addedNodes.forEach((n: HTMLDivElement) => {
				// Filter out non-chat line elements
				if (!n.classList.contains('chat-line__message')) {
					return undefined;
				}

				const fragments = n.getElementsByClassName('text-fragment');
				// do stuff with fragments...
			});
		}
	};

	// Begin observing new elements
	const mutationObserver = new MutationObserver(cb);
	mutationObserver.observe(targetNode, {
		attributes: true, childList: true, subtree: true
	});
}, 1000);
