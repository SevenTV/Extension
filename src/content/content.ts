import { APP_BROADCAST_CHANNEL } from "@/common/Constant";
import { insertEmojiVectors } from "./emoji";

const shouldInject = () => {
	//check if it is top-level window (not an iframe) OR a Twitch popout, allow injection
	return window === window.top || window.location.href.startsWith("https://www.twitch.tv/popout/");
};

(() => {
	"use strict";

	if (!shouldInject()) {
		return;
	}
	// Inject extension into site
	const inject = () => {
		// Script
		const script = document.createElement("script");
		script.src = import.meta.env.DEV
			? import.meta.env.BASE_URL + "src/site/site.ts" : chrome.runtime.getURL("site.js");
						
		script.id = "seventv-extension";
		script.type = "module";
		script.setAttribute("worker_url", chrome.runtime.getURL("worker.js"));
		script.setAttribute("extension_origin", chrome.runtime.getURL(""));

		// Style
		if (!import.meta.env.DEV) {
			const style = document.createElement("link");
			style.rel = "stylesheet";
			style.type = "text/css";
			style.href = chrome.runtime.getURL("assets/" + import.meta.env.VITE_APP_STYLESHEET_NAME);
			style.setAttribute("charset", "utf-8");
			style.setAttribute("content", "text/html");
			style.setAttribute("http-equiv", "content-type");
			style.id = "seventv-stylesheet";

			(document.head || document.documentElement).appendChild(style);
		}

		(document.head || document.documentElement).appendChild(script);

		// Insert emojis
		setTimeout(() => {
			insertEmojiVectors();
		}, 1e3);
	};

	const bc = new BroadcastChannel(APP_BROADCAST_CHANNEL);
	(() => {
		inject();

		// Listen for requests to set up an extension permission
		bc.addEventListener("message", (ev) => {
			switch (ev.data.type) {
				case "seventv-create-permission-listener": {
					const { selector, id, origins, permissions } = ev.data.data as PermissionRequestEvent;

					const btn = document.querySelector<HTMLElement>(selector);
					if (!btn) return;

					btn.addEventListener("switch", () => {
						chrome.runtime.sendMessage(
							{
								type: "permission-request",
								data: { id, origins, permissions },
							},
							{},
							(response: { id: string; granted: boolean }) => {
								if (!response) return;

								bc.postMessage({
									type: "seventv-permission-granted",
									data: { id: response.id, granted: response.granted },
								});
							},
						);
					});
					break;
				}
				case "seventv-update-check": {
					chrome.runtime.sendMessage(
						{ type: "update-check" },
						(response: { status: string; version: string }) => {
							bc.postMessage({
								type: "seventv-update-check-result",
								data: { status: response.status, version: response.version },
							});
						},
					);
				}
			}
		});

		chrome.runtime.onMessage.addListener((msg) => {
			switch (msg.type) {
				case "update-ready": {
					onUpdateDownloaded(msg.data.version ?? "");
					break;
				}
				case "settings-sync": {
					onSettingsUpdated(msg.data.settings ?? []);
					break;
				}
			}
		});
	})();

	function onUpdateDownloaded(version: string): void {
		bc.postMessage({
			type: "seventv-update-ready",
			data: { version },
		});
	}

	function onSettingsUpdated(settings: SevenTV.Setting<SevenTV.SettingNode>[]): void {
		bc.postMessage({
			type: "seventv-settings-sync",
			data: { nodes: settings },
		});
	}
})();

interface PermissionRequestEvent {
	selector: string;
	id: string;
	origins: [];
	permissions: [];
}
