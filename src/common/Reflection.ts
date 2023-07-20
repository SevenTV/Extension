/* eslint-disable @typescript-eslint/no-explicit-any */
import { toRaw } from "vue";

export const PROP_STORE_ACCESSOR = Symbol("seventv.reflection.store");
export const EVENT_STORE_ACCESSOR = Symbol("seventv.reflection.events");
export const PROXY_CUT_THROUGH_ACCESSOR = Symbol("seventv.reflection.proxy_core");

export function getNamedStore<T extends object>(object: T, storeSymbol: symbol) {
	let store;
	if (Object.hasOwnProperty.call(object, storeSymbol)) {
		store = Reflect.get(object, storeSymbol);
	} else {
		store = {};
		Reflect.set(object, storeSymbol, store);
	}

	return store;
}

/**
 * Gets the store where the true value of hooked properties should be stored.
 * Creates one on the object if it does not exist.
 * @param object Object
 * @returns Store for true values
 */
export function getPropStore<T extends object>(object: T): Record<keyof T, any> {
	return getNamedStore(object, PROP_STORE_ACCESSOR) as Record<keyof T, any>;
}

/**
 * Gets the store where named event listeners should be stored.
 * Creates one on the object if it does not exist.
 * @param object Object
 * @returns Store for named event listeners
 */
export function getEventStore<T extends object>(object: T): Record<string, any> {
	return getNamedStore(object, EVENT_STORE_ACCESSOR) as Record<string, any>;
}

/**
 * Hooks the defined property on the passed object, whenever the property is accessed, a Proxy object will be returned instead.
 * Setting a hook will overwrite all previous hooks for the property.
 * @param object Object to hook
 * @param prop Property to define as a proxy
 * @param handler Proxy handler for the defined property
 */
export function definePropertyProxy<
	P extends keyof T,
	T extends object,
	V extends object & T[P],
	H extends object & ProxyHandler<V>,
>(object: T, prop: P, handler: H) {
	let proxy: InstanceType<typeof Proxy> | undefined;
	let handle: ProxyHandler<V> | undefined;
	definePropertyHook(object, prop, {
		value: (v) => {
			if (proxy !== undefined && v === proxy) return;

			if (handle) {
				for (const key of Object.keys(handle)) {
					if (Object.hasOwn(handle, key)) {
						Reflect.deleteProperty(handle, key);
					}
				}
			}

			if (v && typeof v == "object") {
				let currentProxy: InstanceType<typeof Proxy> | undefined = undefined;
				const proxyFunctions: ProxyHandler<typeof v> = {};

				for (const [hook, func] of Object.entries(handler)) {
					switch (hook) {
						case "get":
							Reflect.set(
								proxyFunctions,
								hook,
								function (this: T, target: T, p: string | symbol, ...args: unknown[]) {
									switch (p) {
										case PROXY_CUT_THROUGH_ACCESSOR:
											return v;
										default:
											return func.apply(this, [target, p, ...args]);
									}
								},
							);
							break;
						default:
							Reflect.set(proxyFunctions, hook, func);
					}
				}

				currentProxy = new Proxy(v, proxyFunctions);

				proxy = currentProxy;
				handle = proxyFunctions;
			} else {
				proxy = undefined;
				handle = undefined;
			}
		},
		get: (v) => proxy ?? v,
		set: (v) => {
			if (v && typeof v == "object") {
				return Reflect.get(v, PROXY_CUT_THROUGH_ACCESSOR) ?? v;
			} else {
				return v;
			}
		},
	});
}

/**
 * Hooks the function on the defined property, whenever the defined property is updated it is automatically hooked.
 * Setting a hook will overwrite all previous hooks for the property.
 *
 * When a new value is set to the defined property, the old hooked functions call the previous value at the time of their creation, however will not call the callback.
 * In other words, the hook will only call for the top level execution of nested functions.
 * @param object Object to hook
 * @param prop Function to hook
 * @param callback Callback run whenever the hooked function is called, the original function is provided as the first argument to the callback.
 */
export function defineFunctionHook<T extends object>(
	object: T,
	prop: keyof T,
	callback: (this: T, old: ((...args: any[]) => any) | null, ...args: any[]) => any,
) {
	let hooked: (...args: any[]) => any;
	let currentSymbol: symbol;
	definePropertyHook(object, prop, {
		value: (v) => {
			if (hooked !== undefined && v === hooked) return;

			currentSymbol = Symbol();
			const symbol = currentSymbol;
			const old = typeof v == "function" ? v : null;
			hooked = function (this: T, ...args: any[]) {
				if (symbol === currentSymbol) {
					return Reflect.apply(callback, this, [old, ...args]);
				} else {
					return (old as any)?.apply(this, args);
				}
			};
		},
		get: (v) => hooked ?? v,
	});
}

/**
 * Hooks the passed object, and calls the defined callback functions when the defined property is set or accessed.
 * Setting a hook will overwrite all previous hooks for the property.
 * @param object Object to hook
 * @param prop Property to hook
 * @param hooks An object containing the hooks to call when the hooked property is set or accessed.
 * @param hooks.set Callback to call when the defined property is set, arguments passed contain the current and previous stored values, should return the desired value to set.
 * @param hooks.get Callback to call when the defined property is accessed, argument passed contains the stored value of the property, returns the passed value to the accessor.
 * @param hooks.value Callback to call when the defined property is set similarly to the `set` hook, however the `value` hook also gets called initially for the current value upon hook definition.
 */
export function definePropertyHook<T extends object, K extends keyof T>(
	object: T,
	prop: K,
	hooks: { set?: (newVal: any, oldVal: any) => any; get?: (v: any) => any; value?: (v: T[K]) => void },
) {
	object = toRaw(object);

	const store = getPropStore(object);

	if (!Reflect.has(store, prop)) {
		Reflect.set(store, prop, object[prop]);
	}

	hooks.value?.(Reflect.get(store, prop));

	Reflect.defineProperty(object, prop, {
		configurable: true,
		set: (v) => {
			const oldV = Reflect.get(store, prop);
			const newV = hooks.set ? hooks.set(v, oldV) : v;

			Reflect.set(store, prop, newV);

			hooks.value?.(newV);
		},
		get: () => {
			const v = Reflect.get(store, prop);

			return hooks.get ? hooks.get(v) : v;
		},
	});
}

/**
 * Unhooks the defined property on the passed object, the value of the property is returned to its stored value, and all hooks are removed.
 * @param object Object to remove hook from
 * @param prop Property to unhook
 */
export function unsetPropertyHook<T extends object>(object: T, prop: keyof T) {
	object = toRaw(object);

	Reflect.deleteProperty(object, prop);

	const store = getPropStore(object);

	if (Reflect.has(store, prop)) {
		const v = Reflect.get(store, prop);

		Reflect.set(object, prop, v);

		Reflect.deleteProperty(store, prop);
	}
}

/**
 * Defines a named event handler on the passed element.
 * Setting an event which has already been set under the same namespace, will overwrite the previous event handler for that event.
 * @param target Element to listen to event on
 * @param namespace Namespace to store event handler under
 * @param event Event type
 * @param handler Handler function to call upon event emit
 */
export function defineNamedEventHandler<K extends keyof HTMLElementEventMap>(
	target: HTMLElement,
	namespace: string,
	event: K,
	handler: (ev: HTMLElementEventMap[K]) => void,
	capture?: boolean,
) {
	target = toRaw(target);

	const store = getEventStore(target);
	const prop = `${namespace}:${event}`;

	const oldHandler = Reflect.get(store, prop);
	if (oldHandler) target.removeEventListener(event, oldHandler);

	target.addEventListener(event, handler, { capture });
	Reflect.set(store, prop, handler);
}

/**
 * Unsets the event handler on the passed element in the namespace provided.
 * @param target Element to remove handler from
 * @param namespace Namespace of the event
 * @param event Event type
 */
export function unsetNamedEventHandler<K extends keyof HTMLElementEventMap>(
	target: HTMLElement,
	namespace: string,
	event: K,
) {
	target = toRaw(target);

	const store = getEventStore(target);
	const prop = `${namespace}:${event}`;

	const oldHandler = Reflect.get(store, prop);
	if (oldHandler) target.removeEventListener(event, oldHandler);

	Reflect.deleteProperty(store, prop);
}
