(() => {
	const token = localStorage.getItem("7tv-token");
	if (token) {
		chrome.runtime.sendMessage({
			type: "set-auth-token",
			data: {
				token: token,
			},
		});
	}

	const old = window.localStorage.setItem;

	window.localStorage.setItem = function (key: string, value: string) {
		old.apply(window.localStorage, [key, value]);
		if (key == "7tv-token") {
			chrome.runtime.sendMessage({
				type: "set-auth-token",
				data: {
					token: value,
				},
			});
			window.localStorage.setItem = old;
		}
	};
})();
