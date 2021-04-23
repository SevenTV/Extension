
import { emitHook } from 'src/Content/Global/Hooks';
import { Child, Hook } from 'src/Content/Global/Decorators';
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

	@Hook()
	Test(): void {
		console.log('test');
	}
}

export namespace ExtensionContentScript {

}

// Bootstrap app
(() => {
	new ExtensionContentScript().Test();
})();

window.onbeforeunload = () => chrome.runtime.sendMessage({
	tag: 'Unload'
});

@Child
class Testing implements Child.OnInjected {
	onInjected(): void {
		console.log('INJECTION COMPLETE');
	}
}

new Testing();
