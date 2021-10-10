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
	 * Hides avatar static or GIF depending on the configuration to be in-line with the new setting
	 *
	 * @param newConfig represents the new setting for animated avatars
	 */
	resetAfterConfigChange(newConfig: string): void {
		const tags = document.querySelectorAll<HTMLImageElement>('img.tw-image-avatar[seventv-custom]');
		const canvasList = document.querySelectorAll<HTMLElement>('.seventv-static-emote');

		switch (newConfig) {
			case 'enabled':
				// In case setting was set to 'hover' before
				for (const tag of tags) {
					tag.setAttribute('style', 'display: unset !important');
				}
				for (const canvas of canvasList) {
					canvas.style.visibility = 'hidden';
				}
				break;
			case 'hover':
				// In case setting was set to 'enabled' before
				for (const tag of tags) {
					tag.setAttribute('style', 'display: none !important');
				}
				for (const canvas of canvasList) {
					canvas.style.visibility = 'visible';
				}
				break;
			default:
				break;
		}
	}

	/**
	 * Check profile picture image tags on the page and replace them with custom avatars
	 *
	 * @param scope an optional html element to scope the check to
	 */
	check(scope?: HTMLElement): void {

		// Find avatar image tags
		const tags = (scope ?? document).querySelectorAll<HTMLImageElement>(`img.tw-image-avatar`);

		const avatarSetting = this.page.site.config.get('general.app_avatars')?.asString() ?? 'enabled';

		if (this.checking || avatarSetting === 'disabled') {
			return undefined;
		}
		this.checking = true;

		from(tags).pipe(
			filter((img) => {
				if(avatarSetting === 'hover') {
					return !img.hasAttribute('seventv-custom') || (img.parentElement?.childElementCount ?? 0) < 2;
				} else {
					return !img.hasAttribute('seventv-custom');
				}
			}), // Only match images that haven't already been customized
			// Override the sizing factor to "300x300" in order to create a consistent hash
			mergeMap(img => from(this.hashURL(img.src.replace(avatarSizeRegex, '300x300'))).pipe(map(hash => ({ hash, img }))), 10),
			map(({ hash, img }) => {

				// Try to find a hash for this image
				const url = this.hashMap.get(hash);
				if (!url) { // No hash means profile picture isn't custom
					return undefined;
				}

				// Skip if avatar is in user card
				if(!img.parentElement?.parentElement?.classList.contains('viewer-card-drag-cancel')) {
					// Enable hover functionality
					this.enableAnimateOnHover(img, url, avatarSetting);
				}

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
	 * Make an avatar animated on hover instead of always-on.
	 * Attaches a static frame of the avatar to the DOM on a canvas.
	 *
	 * @param img Avatar to enable hover functionality for
	 * @param url Source URL of the avatar
	 */
	private enableAnimateOnHover(img: HTMLImageElement, url: string | undefined, setting: string) {
		const canvas = document.createElement('canvas');

		// We need a wrapping div as backup because :hover on a canvas is absolutely disgusting
		const canvasWrapper = document.createElement('div');

		// Apply circular border like Twitch avatars
		canvas.classList.add('seventv-static-emote');
		canvasWrapper.classList.add('seventv-static-emote');

		const ctx = canvas.getContext('2d');

		let hasLoadedBefore = false;

		img.onload = (event) => {
			if (hasLoadedBefore) {
				return; // Prevent redrawing canvas after first load
			}
			hasLoadedBefore = true;

			canvas.width = img.width;
			canvasWrapper.style.height = `${img.width}px`;

			canvas.height = img.height;
			canvasWrapper.style.width = `${img.height}px`;

			ctx?.drawImage((event.target as any), 0, 0, img.width, img.height);

			// Replace GIF with static
			if (setting === 'hover') {
				img.setAttribute('style', 'display: none !important');
			} else {
				canvas.style.visibility = 'hidden';
			}

			// Insert static into DOM
			img.after(canvasWrapper);
			canvasWrapper.appendChild(canvas);

			// Define hover events that swap the static with the GIF
			const onMouseEnter = () => {
				if(this.page.site.config.get('general.app_avatars')?.asString() === 'hover') {
					canvas.style.visibility = 'hidden';
					img.setAttribute('style', 'display: unset !important');
				}
			};

			const onMouseLeave = () => {
				if(this.page.site.config.get('general.app_avatars')?.asString() === 'hover') {
					// Workaround to start GIF from the beginning
					if (url) {
						img.src = '';
						img.src = url;
					}

					canvas.style.visibility = 'visible';
					img.setAttribute('style', 'display: none !important');
				}
			};

			// Attach events to a suitable element
			const hoverElement = this.getHoverElement(canvasWrapper);

			hoverElement.addEventListener('mouseenter', onMouseEnter);
			hoverElement.addEventListener('mouseleave', onMouseLeave);
			hoverElement.setAttribute('seventv-hover', '');
		};
	}

	/**
	 * Recursively search for a suitable parent element to
	 * attach hover events to, to trigger an animated avatar.
	 *
	 * @param canvasWrapper Canvas that belongs to the avatar
	 *
	 * @returns the current Element if it has of the given
	 * classes or the original canvasWrapper if nothing was found
	 */
	private getHoverElement(canvasWrapper: HTMLDivElement): Element {
		let parent = canvasWrapper.parentElement;

		for (let i = 0; i < 12; i++) {
			if(!parent) {
				return canvasWrapper;
			} else if (parent.tagName.toLowerCase() === 'article') {
				// Stream preview in game category
				return parent;
			} else if (parent.classList.contains('side-nav-card')) {
				// Navigation sidebar
				return parent;
			} else if (parent.classList.contains('home-header-sticky')) {
				// Offline channel view
				return parent;
			} else if (parent.classList.contains('channel-info-content')) {
				// Infobox on a streamer's channel site below the stream
				return parent.firstElementChild ?? canvasWrapper;
			} else if (parent.classList.contains('search-result-card__img-wrapper')) {
				// Channel search results
				return parent.parentElement ?? canvasWrapper;
			}

			parent = parent.parentElement;
		}

		return canvasWrapper;
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
			tag.setAttribute('style', 'display: unset !important');
		}

		const canvasList = document.querySelectorAll<HTMLImageElement>('div.seventv-static-emote');
		for (const canvas of canvasList) {
			canvas.remove();
		}
	}
}
