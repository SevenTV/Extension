import { Child, PageScriptListener } from 'src/Global/Decorators';
import { settings } from 'src/Content/Runtime/Settings';

@Child
export class App {
	constructor() {
		// Handle config changes
		settings.change.subscribe({
			next: change => this.sendMessageDown('ConfigChange', change)
		});

		chrome.runtime.onMessage.addListener(({ name, event }) => {
			if (name !== 'EVENTAPI:EMOTE_EVENT') {
				return undefined;
			}

			this.sendMessageDown('ChannelEmoteUpdate', event);
		});
	}

	passExtensionData(): void {
		const map = [
			['7tv.webp', chrome.runtime.getURL('image/7tv.webp')],
			['twitter.webp', chrome.runtime.getURL('image/icon/twitter.webp')],
			['discord.webp', chrome.runtime.getURL('image/icon/discord.webp')],
			['theater-mode.webp', chrome.runtime.getURL('image/icon/theater-mode.webp')],
			['stylesheet', chrome.runtime.getURL('styles/Style.css')]
		] as [string, string][];

		this.sendMessageDown('ConfigNodes', settings.nodes);
		this.sendMessageDown('ConfigChange', settings.raw);
		this.sendMessageDown('OnAssets', map);
	}

	@PageScriptListener('SetConfigNode')
	whenConfigNodeIsChanged(data: { key: string; value: string; }): void {
		if (!data.key.startsWith('cfg.')) {
			return undefined;
		}

		settings.apply({ [data.key]: data.value });
	}

	@PageScriptListener('EventAPI:AddChannel')
	addChannelToEventAPISubscriptions(channelName: string): void {
		chrome.runtime.sendMessage({ name: 'EVENTAPI:ADD_CHANNEL', channelName });
	}

	@PageScriptListener('EventAPI:RemoveChannel')
	removehannelFromEventAPISubscriptions(): void {
		chrome.runtime.sendMessage({ name: 'EVENTAPI:REMOVE_CHANNEL' });
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
