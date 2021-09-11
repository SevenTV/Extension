import { BackgroundMessaging } from 'src/Background/Runtime/Messaging';
import { NavHandler } from 'src/Background/Runtime/NavHandler';

chrome.runtime.onInstalled.addListener(() => { // Listen for user loading Twitch
	if (!chrome.webNavigation) return undefined;

	chrome.webNavigation.onCommitted.addListener(() => {
		console.log('Twitch window opened. Activating extension');

	}, { url: [{ urlContains: 'twitch.tv' }] });
});

export const Background = {
	NavHandler: new NavHandler(),
	Messaging: new BackgroundMessaging()
};

// Handle animated avatars
(() => {
	chrome.webRequest.onBeforeRequest.addListener(
	d => {
		// testing.
		console.log(d);

		return {
			redirectUrl: 'https://cdn.7tv.app/emote/603c89cbbb69c00014bed23e/4x'
		};
	},
	{ urls: ['*://static-cdn.jtvnw.net/jtv_user_pictures/*'], types: ['image'] },
	['blocking']
	);
})();
