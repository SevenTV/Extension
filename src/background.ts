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
