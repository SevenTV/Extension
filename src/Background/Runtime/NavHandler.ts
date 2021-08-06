import { API } from 'src/Global/API';
import { Logger } from 'src/Logger';

export class NavHandler {
	private api = new API();

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

			if (msg.tag === 'APIRequest') {
				this.api.createRequest(msg.data.route, msg.data.options).subscribe({
					error(err) { sendResponse(err); },
					next(res) { sendResponse(res); }
				});
			}

			if (msg.tag === 'ConfigureEventAPI') {
				const action = msg.data.do as string;

				switch (action) {
					case 'ADD_CHANNEL':
						this.api.events.addChannel(msg.data.channel);
						break;
					case 'REMOVE_CHANNEL':
						this.api.events.removeChannel(msg.data.channel);
						break;
					default:
						break;
				}
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
