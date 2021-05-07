
import { emitHook } from 'src/Content/Global/Hooks';
import { WebEventListener } from 'src/Global/Decorators';
import { Logger } from 'src/Logger';
import { App } from 'src/Content/App/App';

export class ExtensionContentScript {
	app = new App();
	injected = false;

	constructor() {
		this.inject();
	}

	private inject(): void {
		if (this.injected) {
			return;
		}

		this.injected = true;
		const script = document.createElement('script');
		const style = document.createElement('link');
		style.rel = 'stylesheet';
		style.type = 'text/css';
		style.href = chrome.runtime.getURL('styles/Style.css');
		style.setAttribute('charset', 'utf-8');
		style.setAttribute('content', 'text/html');
		style.setAttribute('http-equiv', 'content-type');
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
	const {} = new ExtensionContentScript();
})();
