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
