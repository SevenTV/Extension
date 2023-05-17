import { HOSTNAME_SUPPORTED_REGEXP } from "@/common/Constant";
import { log } from "@/common/Logger";
import "./messaging";
import "./sync";

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
			setTimeout(() => chrome.runtime.reload(), 100);
		}
	};
}

if (import.meta.env.MODE === "dev") {
	useHotReloading();
}

// On-install onboarding
chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.local.get(({ seen_onboarding, yt_permissions_requested: seenLegacyPopup }) => {
		if (seen_onboarding || seenLegacyPopup) return;

		chrome.runtime.openOptionsPage();
		chrome.storage.local.set({
			seen_onboarding: true,
		});
	});
});

// On-upgrade onboarding (2.x -> 3.x)
const newTabs = new Set<number>();
chrome.tabs.onCreated.addListener((t) => {
	if (typeof t.id !== "number") return;

	newTabs.add(t.id);
});
chrome.tabs.onUpdated.addListener((_, i, t) => {
	if (!i.status || !t.url || !t.id || !newTabs.has(t.id)) return;

	const url = new URL(t.url);
	if (url.host !== "www.twitch.tv") return;

	// "yt_permissions_requested" was used in v2.x.x to open a popup for youtube permissions
	// so we reuse it here to determine if this user is migrating
	chrome.storage.local.get(({ seen_onboarding, yt_permissions_requested: seenLegacyPopup }) => {
		if (!seen_onboarding || seenLegacyPopup) {
			chrome.runtime.openOptionsPage();
			chrome.storage.local.set({
				seen_onboarding: true,
				upgraded: true,
			});
		}
		chrome.storage.local.remove("yt_permissions_requested");
	});
	newTabs.delete(t.id);
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
		if (HOSTNAME_SUPPORTED_REGEXP.test(loc.host)) {
			chrome.tabs.executeScript(tabId, {
				file: "content.js",
			});
		}
	});
} else {
	chrome.scripting.registerContentScripts([
		{
			id: "seventv-youtube",
			js: ["content.js"],
			matches: ["*://*.youtube.com/*", "*://*.kick.com/*"],
		},
	]);
}

// DEBUG: reload background runner
((self || window) as object & { r?: () => void }).r = () => chrome.runtime.reload();
