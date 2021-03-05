

export class BackgroundMessaging {
	send(data: any): void {
		chrome.tabs.query({ url: 'https://www.twitch.tv/*', }, tabs => {
			if (tabs.length === 0) return undefined;

			for (const tab of tabs) {
				chrome.tabs.sendMessage(tab.id, data);
			}
		});
	}
}
