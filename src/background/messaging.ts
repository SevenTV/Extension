// Handle messaging from downstream. Treat every message as untrusted: the
// Twitch page hosts the injected 7TV application and can access its page-world
// communication channel.

let shouldReloadOnUpdate = false;

const ALLOWED_ORIGINS = new Set(["*://*.youtube.com/*", "*://*.kick.com/*", "*://*.7tv.app/*", "*://*.7tv.io/*"]);
const ALLOWED_PERMISSIONS = new Set(["management"]);

chrome.runtime.onMessage.addListener((msg: unknown, sender, reply) => {
	if (!isTrustedSender(sender) || !isRecord(msg) || typeof msg.type !== "string") return false;

	switch (msg.type) {
		case "permission-request": {
			if (import.meta.env.VITE_APP_SAFARI === "true" || !isPermissionRequest(msg.data)) {
				reply({ granted: false, id: isRecord(msg.data) ? String(msg.data.id ?? "") : "" });
				return false;
			}

			const { id, origins, permissions } = msg.data;
			if (
				origins.some((origin) => !ALLOWED_ORIGINS.has(origin)) ||
				permissions.some((permission) => !ALLOWED_PERMISSIONS.has(permission))
			) {
				reply({ granted: false, id });
				return false;
			}

			chrome.permissions.request({ origins, permissions }, (granted) => {
				reply({ granted, id });

				if (!granted) return;

				chrome.runtime.sendMessage({
					type: "permission-granted",
					data: { id },
				});
			});
			return true;
		}
		case "update-check": {
			if (typeof chrome.runtime.requestUpdateCheck !== "function") {
				reply({ status: "no_update", version: null });
				return false;
			}
			shouldReloadOnUpdate = true;

			chrome.runtime.requestUpdateCheck((status, details) => {
				reply({
					status,
					version: details?.version ?? null,
				});
			});
			return true;
		}
		default:
			return false;
	}
});

// Safari does not expose Chromium's extension-update event. Updates to this
// Safari package arrive when the app is rebuilt, so the listener is
// registered only in browsers that implement it.
if (chrome.runtime.onUpdateAvailable) {
	chrome.runtime.onUpdateAvailable.addListener((details) => {
		if (!shouldReloadOnUpdate) return;

		// Notify page script to reload trigger a reload immediately
		broadcastMessage("update-ready", { version: details.version });

		// Reload extension after a tiny delay to allow the downstream message to be sent
		setTimeout(() => chrome.runtime.reload(), 50);
	});
}

function broadcastMessage(type: string, data: unknown): void {
	chrome.tabs.query({}, (tabs) => {
		tabs.forEach((tab) => {
			if (!tab.id || !isSupportedSiteURL(tab.url)) return;

			chrome.tabs.sendMessage(tab.id, { type, data }, () => void chrome.runtime.lastError);
		});
	});
}

function isTrustedSender(sender: chrome.runtime.MessageSender): boolean {
	return isSupportedSiteURL(sender.url) && isSupportedSiteURL(sender.tab?.url);
}

function isSupportedSiteURL(value?: string): boolean {
	if (!value) return false;

	try {
		const url = new URL(value);
		return (
			url.protocol === "https:" &&
			["twitch.tv", "kick.com", "youtube.com"].some(
				(host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
			)
		);
	} catch {
		return false;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isPermissionRequest(value: unknown): value is { id: string; origins: string[]; permissions: string[] } {
	if (!isRecord(value)) return false;

	return (
		typeof value.id === "string" &&
		value.id.length > 0 &&
		value.id.length <= 128 &&
		Array.isArray(value.origins) &&
		value.origins.length <= ALLOWED_ORIGINS.size &&
		value.origins.every((origin) => typeof origin === "string") &&
		Array.isArray(value.permissions) &&
		value.permissions.length <= ALLOWED_PERMISSIONS.size &&
		value.permissions.every((permission) => typeof permission === "string")
	);
}
