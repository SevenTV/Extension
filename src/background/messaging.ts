// Handle messaging from downstream

let shouldReloadOnUpdate = false;

chrome.runtime.onMessage.addListener((msg, _, reply) => {
	switch (msg.type) {
		case "permission-request": {
			const { id, origins, permissions } = msg.data;

			chrome.permissions.request({ origins, permissions }, (granted) => {
				reply({ granted, id });

				if (!granted) return;

				chrome.runtime.sendMessage({
					type: "permission-granted",
					data: { id },
				});
			});
			break;
		}
		case "update-check": {
			if (typeof chrome.runtime.requestUpdateCheck !== "function") return;
			shouldReloadOnUpdate = true;

			/* // sim:
			reply({
				status: "update_available",
				version: "3.0.0.12200",
				done: false,
			});

			setTimeout(() => {
				if (!shouldReloadOnUpdate) return;

				broadcastMessage("update-ready", {
					version: "3.0.0.12200",
				});

				setTimeout(() => chrome.runtime.reload(), 50);
			}, 1500);
			return;
			/// end sim */

			chrome.runtime.requestUpdateCheck((status, details) => {
				reply({
					status,
					version: details?.version ?? null,
				});
			});

			break;
		}
	}

	return true;
});

chrome.runtime.onUpdateAvailable.addListener((details) => {
	if (!shouldReloadOnUpdate) return;

	// Notify page script to reload trigger a reload immediately
	broadcastMessage("update-ready", { version: details.version });

	// Reload extension after a tiny delay to allow the downstream message to be sent
	setTimeout(() => chrome.runtime.reload(), 50);
});

function broadcastMessage(type: string, data: unknown): void {
	chrome.tabs.query({}, (tabs) => {
		tabs.forEach((tab) => {
			if (!tab.id) return;

			chrome.tabs.sendMessage(tab.id, { type, data });
		});
	});
}
