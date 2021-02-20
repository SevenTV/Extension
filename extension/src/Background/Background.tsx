import { BackgroundMessaging } from 'src/Background/Runtime/Messaging';
import { NavHandler } from 'src/Background/Runtime/NavHandler';

chrome.runtime.onInstalled.addListener(() => { // Listen for user loading Twitch
	chrome.webNavigation.onCommitted.addListener(() => {
		console.log('Twitch window opened. Activating extension');
		chrome.tabs.query({ active: true, currentWindow: true }, ([{ id }]) => {
			chrome.pageAction.show(id);

			chrome.tabs.executeScript(null, {file: 'content.js'});
		});
	}, { url: [{ urlContains: 'twitch.tv' }] });
});

export const Background = {
	NavHandler: new NavHandler(),
	Messaging: new BackgroundMessaging()
};
