// Inject extension into site
const inject = () => {
	// Script
	const script = document.createElement("script");
	script.src = import.meta.env.DEV ? import.meta.env.BASE_URL + "src/site/site.ts" : chrome.runtime.getURL("site.js");
	script.id = "seventv-extension";
	script.type = "module";
	script.setAttribute("worker_url", chrome.runtime.getURL("worker.js"));
	script.setAttribute("assets_url", chrome.runtime.getURL("assets"));

	// Style
	if (!import.meta.env.DEV) {
		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.type = "text/css";
		style.href = chrome.runtime.getURL("assets/style.css");
		style.setAttribute("charset", "utf-8");
		style.setAttribute("content", "text/html");
		style.setAttribute("http-equiv", "content-type");
		style.id = "seventv-stylesheet";

		(document.head || document.documentElement).appendChild(style);
	}

	(document.head || document.documentElement).appendChild(script);
};

(() => {
	inject();

	// Listen for requests to set up an extension permission
	window.addEventListener("message", (ev) => {
		switch (ev.data.type) {
			case "seventv-create-permission-listener": {
				const { selector, id, origins, permissions } = ev.data.data as PermissionRequestEvent;

				const btn = document.querySelector<HTMLElement>(selector);
				if (!btn) return;

				btn.addEventListener("click", () => {
					chrome.runtime.sendMessage(
						{
							type: "permission-request",
							data: {
								id,
								origins,
								permissions,
							},
						},
						{},
						(response: { id: string; granted: boolean }) => {
							if (!response) return;

							window.postMessage({
								type: "seventv-permission-granted",
								data: {
									id: response.id,
									granted: response.granted,
								},
							});
						},
					);
				});
				break;
			}
		}
	});
})();

interface PermissionRequestEvent {
	selector: string;
	id: string;
	origins: [];
	permissions: [];
}
