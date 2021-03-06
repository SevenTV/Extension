import { BackgroundMessaging } from 'src/Background/Runtime/Messaging';
import { NavHandler } from 'src/Background/Runtime/NavHandler';

const runningTabs = new Map<number, chrome.tabs.Tab>();
chrome.runtime.onInstalled.addListener(() => { // Listen for us;er loading Twitch
	chrome.webNavigation.onCommitted.addListener(() => {
		console.log('Twitch window opened. Activating extension');

	}, { url: [{ urlContains: 'twitch.tv' }] });
});

export const Background = {
	NavHandler: new NavHandler(),
	Messaging: new BackgroundMessaging()
};
