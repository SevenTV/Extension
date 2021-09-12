import { from, of, timer } from 'rxjs';
import { catchError, filter, map, mergeMap, take, tap } from 'rxjs/operators';
import { Config } from 'src/Config';
import { get } from 'superagent';

const ppEndpoint = 'https://static-cdn.jtvnw.net/jtv_user_pictures/';

export class AvatarManager {
	checking = false;
	observing = false;
	sidebarElement = document.querySelector('[data-test-selector="side-nav"]') as HTMLElement;
	sidebarObserver = new MutationObserver(() => this.check());
	cache = new Map<string, string>();

	constructor() {
		// Detect sidebar changes
		this.sidebarObserver.observe(this.sidebarElement, {
			childList: true,
			subtree: true
		});

		// Detect location changes
		let currentLocation = document.location.href;
		setInterval(() => {
			if (currentLocation === document.location.href) {
				return undefined;
			}
			currentLocation = document.location.href;

			timer(500, 1000).pipe(
				take(5),
				tap(() => this.check())
			).subscribe();
		}, 200);
	}

	check(scope?: HTMLElement): void {
		if (this.checking) {
			return undefined;
		}
		this.checking = true;

		const tags = (scope ?? document).querySelectorAll<HTMLImageElement>(`img.tw-image-avatar`);

		from(tags).pipe(
			filter(img => img.src.startsWith(ppEndpoint)),
			map(img => ({ img, id: img.src.slice(ppEndpoint.length) ?? '' })),
			filter(({ id }) => id !== ''),
			mergeMap(({ img, id }) => (!this.cache.has(id)
				? from(
					get(`${Config.secure ? 'https' : 'http'}:${Config.apiUrl}/v2/cosmetics/avatar-map/twitch?url=${img.src}`)
				).pipe(map(res => res.body.url))
				: of(this.cache.get(id))
			).pipe(map(url => ({ url: url, img, id }))), 5),
			map(({ url, img, id }) => {
				img.src = url;
				if (!url.startsWith('https://static-cdn.jtvnw.net')) {
					img.srcset = '';
				}

				this.cache.set(id, url);
			}),
			catchError(() => of())
		).subscribe({
			complete: () => this.checking = false
		});
	}
}
