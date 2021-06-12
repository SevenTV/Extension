import { API } from 'src/Global/API';
import { WebSocketAPI } from 'src/Global/WebSocket/WebSocket';
import { Logger } from 'src/Logger';

export class NavHandler {
	private api = new API();
	private loadedTabs = new Map<number, NavHandler.TabWithSocket>();

	ws: WebSocketAPI | null = null;

	constructor() {
		setInterval(() => {
			chrome.tabs.query({
				url: '*://*.twitch.tv/*'
			}, tabs => {
				if (tabs.length > 0) {
					return undefined;
				}

				// Terminate the websocket if user is no longer using Twitch.
				this.ws?.close();
			});
		}, 30 * 1000);

		chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
			if (!sender.tab) {
				return undefined;
			}
			const tabId = sender.tab?.id ?? 0;
			if (tabId === 0) return undefined;

			// Listen for tabs being unloaded
			if (msg.tag === 'Unload') {
				this.loadedTabs.delete(tabId);
				Logger.Get().info(`Unloaded tab ${tabId}`);
				sendResponse('goodbye');
			}

			if (msg.tag === 'APIRequest') {
				this.api.createRequest(msg.data.route, msg.data.options).subscribe({
					error(err) { sendResponse(err); },
					next(res) { sendResponse(res); }
				});
			}

			if (msg.tag === 'EditWebSocket') {
				const action = msg.data.do as WebSocketAPI.ExtensionMessage.Type;

				switch (action) {
					case 'create':
						const socket = this.ws ?? this.api.newWebSocket();
						if (socket.closed) {
							socket.create();
							this.ws = socket;
						}

						break;
					case 'send-message':
						const d = msg.data.d;
						const op = msg.data.op;

						this.ws?.send(op, d);
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

	export interface TabWithSocket extends chrome.tabs.Tab {
		socket?: WebSocketAPI;
	}
}
