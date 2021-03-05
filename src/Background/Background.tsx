import { BackgroundMessaging } from 'src/Background/Runtime/Messaging';
import { NavHandler } from 'src/Background/Runtime/NavHandler';

const runningTabs = [] as number[];
chrome.runtime.onInstalled.addListener(() => { // Listen for user loading Twitch
	chrome.webNavigation.onCommitted.addListener(() => {
		console.log('Twitch window opened. Activating extension');
		chrome.tabs.query({ url: 'https://www.twitch.tv/*', active: true, currentWindow: true }, tabs => {
			const tab = tabs[0];
			runningTabs.push(tab.id);
			chrome.pageAction.show(tab.id);

			chrome.tabs.executeScript(tab.id, { file: 'content.js' }, () => {
				Background.NavHandler.onContentOK();
			});
		});
	}, { url: [{ urlContains: 'twitch.tv' }] });
});

export const Background = {
	NavHandler: new NavHandler(),
	Messaging: new BackgroundMessaging()
};
