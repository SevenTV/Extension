

export class BackgroundMessaging {
	send(data: any): void {
		chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
			if (tabs.length === 0) return undefined;
			const tab = tabs[0];

			chrome.tabs.sendMessage(tab.id, data);
		});
	}
}
