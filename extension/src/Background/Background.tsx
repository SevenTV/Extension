chrome.runtime.onInstalled.addListener(() => {
	chrome.webNavigation.onCommitted.addListener(() => {
		console.log('Twitch window opened. Activating extension');
		chrome.tabs.query({ active: true, currentWindow: true }, ([{ id }]) => {
			chrome.pageAction.show(id);
		});

	}, { url: [{ urlContains: 'twitch.tv' }] });
});
