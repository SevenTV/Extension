import { from, fromEvent, timer } from 'rxjs';
import { filter, map, mergeMap, switchMap, take, tap } from 'rxjs/operators';
import { Config } from 'src/Config';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';
import { get } from 'superagent';

const avatarSizeRegex = /([0-9]{2,3})x([0-9]{2,3})/;

export class AvatarManager {
	checking = false;
	observing = false;
	sidebarElement = document.querySelector('[data-test-selector="side-nav"]') as HTMLElement;
	sidebarObserver = new MutationObserver(() => this.check());
	hashMap = new Map<string, string>();

	constructor(private page: TwitchPageScript) {
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
				for (const k of Object.keys(res.body)) {
					this.hashMap.set(k, res.body[k]);
				}
				this.check();
			}).catch(err => console.error(err));
	}

	/**
	 * Check profile pictureimage tags on the page and replace them with custom avatars
	 *
	 * @param scope an optional html element to scope the check to
	 */
	check(scope?: HTMLElement): void {
		if (!this.page.site.config.get('general.app_avatars')?.asBoolean()) {
			return undefined;
		}
		if (this.checking) {
			return undefined;
		}
		this.checking = true;

		// Find avatar image tags
		const tags = (scope ?? document).querySelectorAll<HTMLImageElement>(`img.tw-image-avatar`);
		from(tags).pipe(
			filter(img => !img.hasAttribute('seventv-custom')), // Only match images that haven't already been customized
			// Override the sizing factor to "300x300" in order to create a consistent hash
			mergeMap(img => from(this.hashURL(img.src.replace(avatarSizeRegex, '300x300'))).pipe(map(hash => ({ hash, img }))), 10),
			map(({ hash, img }) => {
				// Try to find a hash for this image
				const url = this.hashMap.get(hash);
				if (!url) { // No hash means profile picture isn't custom
					return undefined;
				}

				// Capture first frame as static image for hover
				// TODO: if (this.page.site.config.get('general.app_avatars_hover')?.asBoolean()) {
					const canvas = document.createElement('canvas');
					canvas.setAttribute('style', 'border-radius: 9000px; position: absolute; top: 0; left: 0');
					const ctx = canvas.getContext('2d');
	
					img.onload = (event) => {
						canvas.width = img.width;
						canvas.height = img.height;
						ctx?.drawImage((event.target as any), 0, 0, img.width, img.height);
						img.parentNode?.appendChild(canvas);
					}				
				//}

				// Update the image.
				const srcOG = img.src;
				const srcsetOG = img.src;
				img.src = url;
				img.srcset = `${url} 1x`;
				img.setAttribute('src-original', srcOG);
				img.setAttribute('srcset-original', srcsetOG);
				img.setAttribute('seventv-custom', '');
			})
		).subscribe({
			complete: () => this.checking = false,
			error: err => console.error('could not update avatars', err)
		});
	}

	/**
	 * Create a sha-256 hash of the avatar URL
	 *
	 * This is matched against a server-side generated hash to
	 * efficiently recognize which profile pictures are custom
	 */
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
