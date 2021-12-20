import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { EventAPI } from 'src/Global/Events/EventAPI';

const activeTabs = new Map<number, TabWithChannels>();
const eventAPI = new EventAPI();

{
	// YouTube Upgrade Popup
	chrome.runtime.onInstalled.addListener(() => {
		chrome.permissions.contains({
			origins: ['*://*.youtube.com/*']
		}, granted => {
			if (granted) {
				return undefined;
			}

			chrome.storage.local.get(items => {
				if (items.yt_permissions_requested) {
					return undefined;
				}

				chrome.tabs.create({
					url: 'yt_upgrade/yt_upgrade.html'
				}, () => {
					chrome.storage.local.set({ yt_permissions_requested: true });
				});
			});
		});
	});
}

// Run YouTube Content Script & Handle tabs
chrome.tabs.onUpdated.addListener((tabId, i, t) => {
	if (!i.status || !t.url) {
		return undefined;
	}
	if (!activeTabs.has(tabId)) {
		activeTabs.set(tabId, {
			...t,
			eventAPI: {
				channel: '',
				subscriber: null
			}
		});
	}

	const loc = new URL(t.url);
	if (ytHostnameRegex.test(loc.host)) {
		chrome.tabs.executeScript(tabId, {
			file: 'content.js'
		});
	}
});
chrome.tabs.onRemoved.addListener(tabId => {
	const t = activeTabs.get(tabId);
	if (!!t && t.eventAPI) {
		t.eventAPI.subscriber?.unsubscribe();
		eventAPI.removeChannel(t.eventAPI.channel);
	}

	activeTabs.delete(tabId);
});
const ytHostnameRegex = /([a-z0-9]+[.])*youtube[.]com/;

// Event API
{
	chrome.runtime.onMessage.addListener(({ name, channelName }, { tab }) => {
		if (!name?.startsWith('EVENTAPI:')) {
			return undefined;
		}

		// Get active tab
		const t = activeTabs.get(tab?.id as number);
		if (!t) {
			return undefined;
		}
		if (t.eventAPI.subscriber && !t.eventAPI.subscriber.closed) {
			t.eventAPI.subscriber.unsubscribe();
		}

		if (name === 'EVENTAPI:REMOVE_CHANNEL') {
			if (t.eventAPI.channel) {
				eventAPI.removeChannel(t.eventAPI.channel);
			}

			return undefined;
		}
		// Add the channel to state.
		// Also add it to the tab's channel list so it can be cleared
		// oncce the tab is closed.
		t.eventAPI.channel = channelName;
		t.eventAPI.subscriber = eventAPI.emoteEvent.pipe(
			filter(({ channel }) => channel === channelName)
		).subscribe({
			next(event) {
				chrome.tabs.sendMessage(t.id as number, { name: 'EVENTAPI:EMOTE_EVENT', event });
			}
		});

		eventAPI.addChannel(channelName);
		activeTabs.set(t.id as number, t);
	});
}

interface TabWithChannels extends chrome.tabs.Tab {
	eventAPI: {
		channel: string;
		subscriber: Subscription | null;
	};
}
