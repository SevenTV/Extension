import { BackgroundMessaging } from 'src/Background/Runtime/Messaging';
import { NavHandler } from 'src/Background/Runtime/NavHandler';

chrome.runtime.onInstalled.addListener(() => { // Listen for us;er loading Twitch
	if (!chrome.webNavigation.onCommitted) return undefined;

	chrome.webNavigation.onCommitted.addListener(() => {
		console.log('Twitch window opened. Activating extension');

	}, { url: [{ urlContains: 'twitch.tv' }] });
});

export const Background = {
	NavHandler: new NavHandler(),
	Messaging: new BackgroundMessaging()
};
