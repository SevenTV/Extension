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

export const Hook = () => function(_target: Object, _propertyKey: string, descriptor: PropertyDescriptor) {
	const originalMethod = descriptor.value;

	descriptor.value = function(...args: any[]) {
		return originalMethod.apply(this, args);
	};

	return descriptor;
};


class AnyClass {
	constructor(..._args: any[]) {}
}
