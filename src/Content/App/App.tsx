import { Child, PageScriptListener } from 'src/Global/Decorators';
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
			['7tv-nd.webp', chrome.runtime.getURL('image/7tv-nd.webp')],
			['twitter.webp', chrome.runtime.getURL('image/icon/twitter.webp')],
			['discord.webp', chrome.runtime.getURL('image/icon/discord.webp')],
			['theater-mode.webp', chrome.runtime.getURL('image/icon/theater-mode.webp')],
			['stylesheet', chrome.runtime.getURL('styles/Style.css')]
		] as [string, string][];

		this.sendMessageDown('ConfigChange', settings.raw);
		this.sendMessageDown('OnAssets', map);
	}

	@PageScriptListener('OpenConfigMenu')
	whenOpenTheConfigMenu(): void {
		const overlay = document.querySelector('.seventv-overlay');
		console.log('open overlay', overlay);
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
