chrome.runtime.onInstalled.addListener(() => {
	// eslint-disable-next-line no-console
	console.log("extension installed");
});

const data = { token: undefined as string | undefined };

let listener = (v: { token: string }) => {
	v;
};

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
		case "get-auth-token": {
			const token = data.token;
			if (token) setTimeout(() => reply({ token: token }), 1);
			else listener = (v: { token: string }) => reply(v);

			break;
		}
		case "set-auth-token": {
			if (!msg.data.token) return;

			listener(msg.data);
			data.token = msg.data.token;
			break;
		}
	}

	return true;
});
