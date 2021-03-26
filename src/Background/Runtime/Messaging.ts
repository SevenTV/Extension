import { Logger } from "src/Logger";

export class BackgroundMessaging {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
	send(data: any, tabId: number): void {
		chrome.tabs.query({ url: "https://www.twitch.tv/*" }, (tabs) => {
			for (const tab of tabs) {
				if (tab.id !== tabId) continue;

				Logger.Get().info(`Send to tab ${tabId}: ${JSON.stringify(data)}`);
				chrome.tabs.sendMessage(tab.id, data);
			}
		});
	}
}
