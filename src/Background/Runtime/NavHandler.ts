import { Logger } from 'src/Logger';

export class NavHandler {
	constructor() {
		chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
			if (!sender.tab) {
				return undefined;
			}
			const tabId = sender.tab?.id ?? 0;
			if (tabId === 0) return undefined;

			// Listen for tabs being unloaded
			if (msg.tag === 'Unload') {
				Logger.Get().info(`Unloaded tab ${tabId}`);
				sendResponse('goodbye');
			}

			return true;
		});
	}
}

export namespace NavHandler {
	export interface CheckVersionResult {
		version: string;
		releaseUrl: string;
	}

	export interface CurrentChannelUpdate {
		channelName: string;
		tab: chrome.tabs.Tab;
	}
}
