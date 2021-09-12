import { from, fromEvent, of, timer } from 'rxjs';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Config } from 'src/Config';
import { PageScript } from 'src/Page/Page';
import { get } from 'superagent';

const ppEndpoint = 'https://static-cdn.jtvnw.net/jtv_user_pictures/';
const avatarSizeRegex = /([0-9]{2,3})x([0-9]{2,3})/;

export class AvatarManager {
	checking = false;
	observing = false;
	sidebarElement = document.querySelector('[data-test-selector="side-nav"]') as HTMLElement;
	sidebarObserver = new MutationObserver(() => this.check());
	hashMap = new Map<string, string>();

	constructor(private page: PageScript) {
		if (!!this.sidebarElement) {
			// Detect sidebar changes
			this.sidebarObserver.observe(this.sidebarElement, {
				childList: true,
				subtree: true
			});
		}

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

		// Check on clicks
		fromEvent(document, 'click').pipe(
			switchMap(() => timer(0, 300).pipe(take(5)))
		).subscribe({ next: () => this.check() });

		// Get avatar map
		get(`${Config.secure ? 'https' : 'http'}:${Config.apiUrl}/v2/cosmetics/avatars`)
			.send()
			.then(res => {
				console.log(res.body);
				for (const k of Object.keys(res.body)) {
					this.hashMap.set(k, res.body[k]);
				}
			}).catch(err => console.error(err));
	}

	/**
	 * Check  profile pictureimage tags on the page and replace them with custom avatars
	 *
	 * @param scope an optional html element to scope the check to
	 */
	check(scope?: HTMLElement): void {
		if (!this.page.config.get('general.app_avatars')?.asBoolean()) {
			return undefined;
		}
		if (this.checking) {
			return undefined;
		}
		this.checking = true;

		const tags = (scope ?? document).querySelectorAll<HTMLImageElement>(`img.tw-image-avatar`);

		from(tags).pipe(
			filter(img => img.src.startsWith(ppEndpoint)),
			switchMap(img => from(this.hashURL(img.src.replace(avatarSizeRegex, '300x300'))).pipe(map(hash => ({ hash, img })))),
			map(({ hash, img }) => {
				const url = this.hashMap.get(hash);
				if (!url) {
					return undefined;
				}

				const srcOG = img.src;
				const srcsetOG = img.src;
				img.src = url;
				img.srcset = `${url} 1x`;
				img.setAttribute('src-original', srcOG);
				img.setAttribute('srcset-original', srcsetOG);
				img.setAttribute('seventv-custom', '');
			}),
			catchError(() => of())
		).subscribe({
			complete: () => this.checking = false
		});
	}

	private async hashURL(url: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(url);
		const buf = await crypto.subtle.digest('SHA-256', data);
		const arr = Array.from(new Uint8Array(buf));
		const hex = arr.map(b => b.toString(16).padStart(2, '0')).join('');

		return hex;
	}

	/**
	 * Revert all avatars affected by 7TV to the original value
	 */
	revert(): void {
		const tags = document.querySelectorAll<HTMLImageElement>('img.tw-image-avatar[seventv-custom]');

		for (const tag of tags) {
			tag.src = tag.getAttribute('src-original') ?? tag.src;
			tag.srcset = tag.getAttribute('srcset-original') ?? tag.srcset;
			tag.removeAttribute('seventv-custom');
			tag.removeAttribute('src-original');
			tag.removeAttribute('srcset-original');
		}
	}
}
