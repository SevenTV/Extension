chrome.runtime.onInstalled.addListener(() => {
	// eslint-disable-next-line no-console
	console.log("extension installed");
});

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
	}

	return true;
});
