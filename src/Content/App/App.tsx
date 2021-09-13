import { Child } from 'src/Global/Decorators';
import { settings } from 'src/Content/Runtime/Settings';

@Child
export class App {
	constructor() {
		// Handle config changes
		settings.change.subscribe({
			next: change => this.sendMessageDown('ConfigChange', change)
		});
	}

	passExtensionData(): void {
		const map = [
			['7tv.webp', chrome.runtime.getURL('image/7tv.webp')],
			['7tv-nd.webp', chrome.runtime.getURL('image/7tv-nd.webp')]
		] as [string, string][];

		this.sendMessageDown('ConfigChange', settings.raw);
		this.sendMessageDown('OnAssets', map);
	}

	/**
	 * Send a message to the page script layer
	 *
	 * @param tag the event tag
	 * @param data the event data
	 */
	sendMessageDown(tag: string, data: any): void {
		window.dispatchEvent(new CustomEvent(`7TV#${tag}`, { detail: JSON.stringify(data) }));
	}
}
