
import { emitHook } from 'src/Content/Global/Hooks';
import { WebEventListener } from 'src/Content/Global/Decorators';
import { Logger } from 'src/Logger';
import { App } from 'src/Content/App/App';

export class ExtensionContentScript {
	app = new App();

	constructor() {
		this.inject();
	}

	private inject(): void {
		const script = document.createElement('script');
		const style = document.createElement('link');
		style.rel = 'stylesheet';
		style.type = 'text/css';
		style.href = chrome.runtime.getURL('styles/Style.css');
		script.src = chrome.runtime.getURL('page.js');
		script.onload = () => {
			Logger.Get().info('Injected into Twitch');

			emitHook('onInjected');
		};

		(document.head ?? document.documentElement).appendChild(script);
		(document.head ?? document.documentElement).appendChild(style);
	}

	@WebEventListener('window', 'beforeunload')
	whenThePageUnloads(): void { // On beforeunload event, send message to background that this tab is no longer active
		chrome.runtime.sendMessage({
			tag: 'Unload'
		});
	}
}

export namespace ExtensionContentScript {}

// Bootstrap app
(() => {
	new ExtensionContentScript();
})();
