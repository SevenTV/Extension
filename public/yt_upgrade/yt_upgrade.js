window.addEventListener('DOMContentLoaded', () => {
	// Listen for the user clicking the button to grant permissions
	document.getElementById('interact').addEventListener('click', () => {
		chrome.permissions.request({
			origins: ['*://*.youtube.com/*']
		}, ok => {
			if (!ok) {
				return undefined;
			}
			window.close();
		});
	});
});
