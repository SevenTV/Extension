// YouTube Upgrade Popup
chrome.runtime.onInstalled.addListener(() => {
	chrome.permissions.contains({
		origins: ['*://*.youtube.com/*']
	}, granted => {
		if (granted) {
			return undefined;
		}

		chrome.storage.local.get(items => {
			if (items.yt_permissions_requested) {
				return undefined;
			}

			chrome.windows.create({
				url: 'yt_upgrade/yt_upgrade.html',
				width: 800,
				height: 700,
				focused: true,
				type: 'popup'
			}, () => {
				chrome.storage.local.set({ yt_permissions_requested: true });
			});
		});
	});
});

// Run YouTube Content Script
const activeTabs = new Map<number, chrome.tabs.Tab>();
chrome.tabs.onUpdated.addListener((tabId, i, t) => {
	if (!i.status || !t.url) {
		return undefined;
	}
	activeTabs.set(tabId, t);

	const loc = new URL(t.url);
	if (ytHostnameRegex.test(loc.host)) {
		chrome.tabs.executeScript(tabId, {
			file: 'content.js'
		});
	}
});
chrome.tabs.onRemoved.addListener(tabId => {
	activeTabs.delete(tabId);
});
const ytHostnameRegex = /([a-z0-9]+[.])*youtube[.]com/;

