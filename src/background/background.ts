import { log } from "@/common/Logger";
import "./messaging";
import "./sync";

const HOSTNAME_YT_REGEXP = /([a-z0-9]+[.])*youtube[.]com/;

// Connect to Vite server
//
// (this is only used in dev mode)
function useHotReloading() {
	const ws = new WebSocket("ws://localhost:4778");

	ws.onclose = () => setTimeout(() => useHotReloading(), 500);
	ws.onmessage = (e) => {
		const { event } = JSON.parse(e.data);
		if (event === "defined-match") {
			log.info("Background files changed, reloading extension...");
			chrome.runtime.reload();
		}
	};
}

if (import.meta.env.MODE === "dev") {
	useHotReloading();
}

chrome.runtime.onInstalled.addListener(() => {
	// "yt_permissions_requested" was used in v2.x.x to open a popup for youtube permissions
	// so we reuse it here to determine if this user is migrating

	chrome.storage.local.get(({ seen_onboarding, yt_permissions_requested: seenLegacyPopup }) => {
		if (seen_onboarding) return;

		chrome.runtime.openOptionsPage();
		chrome.storage.local.set({
			seen_onboarding: true,
			upgraded: seenLegacyPopup,
		});
		chrome.storage.local.remove("yt_permissions_requested");
	});
});

// Register content scripts
const activeTabs = new Set<number>();
if (!chrome.scripting) {
	chrome.tabs.onUpdated.addListener((tabId, i, t) => {
		if (!i.status || !t.url) {
			return undefined;
		}
		if (!activeTabs.has(tabId)) {
			activeTabs.add(tabId);
		}

		const loc = new URL(t.url);
		if (HOSTNAME_YT_REGEXP.test(loc.host)) {
			chrome.tabs.executeScript(tabId, {
				file: "content.js",
				allFrames: true,
			});
		}
	});
} else {
	chrome.scripting.registerContentScripts([
		{
			id: "seventv-youtube",
			js: ["content.js"],
			matches: ["*://*.youtube.com/*"],
			allFrames: true,
		},
	]);
}

// DEBUG: reload background runner
((self || window) as object & { r?: () => void }).r = () => chrome.runtime.reload();
