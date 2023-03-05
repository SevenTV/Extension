import "./messaging";
import "./sync";

const HOSTNAME_YT_REGEXP = /([a-z0-9]+[.])*youtube[.]com/;

chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.local.get(({ seen_onboarding }) => {
		if (seen_onboarding) return;

		chrome.runtime.openOptionsPage();
		chrome.storage.local.set({ seen_onboarding: true });
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
(window as Window & { r?: () => void }).r = () => chrome.runtime.reload();
