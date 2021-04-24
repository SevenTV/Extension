import { HookStore } from 'src/Content/Global/Hooks';

export function Child<T extends typeof AnyClass>(target: T) {
	return class extends target {
		constructor(...args: any[]) {
			super(args);

			HookStore.add(this as this & Child.WithAllHooks);
		}
	};
}
export namespace Child {
	export interface OnInit {
		/** @when the content script has just been initiated  */
		onInit(): void;
	}

	export interface OnAppLoaded {
		/** @when the main app component (containing 7tv ui such as settings or tooltips) is loaded */
		onAppLoaded(): void;
	}

	export interface OnInjected {
		/** @when the extension is injected into the page and nested into twitch's react instance  */
		onInjected(): void;
	}

	export interface OnUnload {
		/** @when the */
		onUnload(): void;
	}

	export interface OnEmoteSetAdded {
		/** @when an emote set is added to the UI */
		onEmoteSetAdd(setID?: string, set?: any[]): void;
	}

	export interface OnEmoteSetRemoved {
		/** @when an emote set is removed from the UI */
		onEmoteSetRemove(set?: string): void;
	}

	export interface OnChannelSwitch {
		/** @when the channel currently loaded has changed */
		onChannelSwitch(): void;
	}

	export type WithAllHooks = OnInit & OnAppLoaded & OnInjected & OnUnload & OnEmoteSetAdded & OnEmoteSetRemoved & OnChannelSwitch;
}

export function WebEventListener<T extends void>(scope: 'window', eventName: keyof (DocumentEventMap & WindowEventHandlersEventMap)): MethodDecoratorArguments;
export function WebEventListener<T extends void>(scope: 'document', eventName: keyof DocumentEventMap): MethodDecoratorArguments;
export function WebEventListener<T extends HTMLElement>(scope: 'element', eventName: keyof DocumentEventMap, element: T): MethodDecoratorArguments;
export function WebEventListener<T extends void | HTMLElement>(
	scope: 'window' | 'document' | 'element',
	eventName: keyof (DocumentEventMap & WindowEventHandlersEventMap),
	element?: T
) {
	return function(_target: Object, _propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		if (scope === 'element') {
			if (!(element instanceof HTMLElement)) {
				throw new Error('Added listener with element scope but did not give an element');
			}

			(element as any)['on' + eventName] = (ev: Event) => originalMethod(ev);
		} else if (scope === 'window') {
			(window as any)['on' + eventName] = (ev: Event) => originalMethod(ev);
		} else if (scope === 'document') {
			(document as any)['on' + eventName] = (ev: Event) => originalMethod(ev);
		}

		return descriptor;
	};
}

export function PageScriptListener(tag: string) {
	return function(_target: Object, _propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		window.addEventListener(`7TV#${tag}`, event => {
			if (!(event instanceof CustomEvent)) return undefined;
			const ev = event as CustomEvent;

			const data = JSON.parse(ev.detail);
			originalMethod(data);
		});
	};
}

type MethodDecoratorArguments = (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;

class AnyClass {
	constructor(..._args: any[]) { }
}
