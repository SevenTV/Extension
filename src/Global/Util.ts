export function getRunningContext(): Context {
	try {
		if (!!chrome.extension?.getBackgroundPage) {
			return 'background';
		}
		else if (typeof chrome.runtime.id !== 'undefined') {
			return 'content';
		} else {
			return 'page';
		}
	}
	catch (_) {
		return 'content';
	}
}

export function sendExtensionMessage (tag: string, data: any, callback?: ((response: any) => void)): void {
	chrome.runtime.sendMessage({
		tag,
		data
	}, callback);
}

type Context = 'background' | 'content' | 'page';

export interface ExtensionRuntimeMessage<T = any> {
	tag: string;
	data: T;
}
