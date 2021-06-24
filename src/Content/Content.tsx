
import { emitHook } from 'src/Content/Global/Hooks';
import { WebEventListener } from 'src/Global/Decorators';
import { Logger } from 'src/Logger';
import { App } from 'src/Content/App/App';

export class ExtensionContentScript {
	app = new App();
	injected = false;

	constructor() {
		this.inject();

		// Load FFZ Add-on in place of 7TV?
		{
			const inject = (scriptName: string, id?: string) => {
				const script = document.createElement('script');
				script.src = chrome.runtime.getURL(scriptName);
				if (typeof id === 'string') {
					script.id = id;
				}
				document.head.appendChild(script);
			};

			let injected = false;
			const attemptLoad = () => {
				if (!injected) {
					inject('ffz_addon.js', 'ffz-addon-seventv-emotes');
					this.app.sendMessageDown('Cease', {});

					Logger.Get().info(`FrankerFaceZ Detected -- unloading 7TV PageScript and loading as an FFZ Add-On`);
				}
			};

			window.addEventListener('message', function (event: any) {
				if (event.data !== 'FFZ_HOOK::FFZ_ADDONS_READY') {
					return undefined;
				}

				attemptLoad();
			});

			inject('ffz_hook.js');
		}
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
