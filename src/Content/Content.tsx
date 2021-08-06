
import { emitHook } from 'src/Content/Global/Hooks';
import { WebEventListener } from 'src/Global/Decorators';
import { Logger } from 'src/Logger';
import { App, unloadEmoteButton } from 'src/Content/App/App';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export class ExtensionContentScript {
	app = new App();
	static destroyed = new Subject<void>();
	injected = false;
	pageScriptLoaded = new BehaviorSubject<boolean>(false);

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

					Logger.Get().info(`FrankerFaceZ Detected -- unloading 7TV PageScript and loading as an FFZ Add-On`);
					this.pageScriptLoaded.pipe(
						filter(r => r === true)
					).subscribe({
						next: () => {
							this.app.sendMessageDown('Cease', {});
							unloadEmoteButton();
						}
					});
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

			this.pageScriptLoaded.next(true);
			emitHook('onInjected');
		};

		(document.head ?? document.documentElement).appendChild(script);
		(document.head ?? document.documentElement).appendChild(style);
	}

	@WebEventListener('window', 'beforeunload')
	whenThePageUnloads(): void { // On beforeunload event, send message to background that this tab is no longer active
		ExtensionContentScript.destroyed.next(undefined);
		ExtensionContentScript.destroyed.complete();
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
