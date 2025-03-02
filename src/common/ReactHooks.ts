import { onUnmounted, reactive } from "vue";
import { ObserverPromise } from "@/common/Async";
import { defineFunctionHook, definePropertyHook, unsetPropertyHook } from "@/common/Reflection";

export const REACT_ROOT_SELECTOR = "#root";
export const REACT_ELEMENT_SYMBOL = Symbol.for("react.element");
export const WRAPPER_ACCESSOR = Symbol.for("seventv.react.wrapper");

/**
 * Get React root node.
 * @returns Node representing the root of the React VDOM tree
 */
export function getRootVNode(): ReactExtended.ReactVNode | undefined {
	const element = document.querySelector(REACT_ROOT_SELECTOR);
	if (!element) return undefined;

	for (const k in element) {
		if (k.startsWith("_reactRootContainer") || k.startsWith("__reactContainer$")) {
			const root = Reflect.get(element, k);

			return root?._internalRoot?.current ?? root;
		}
	}

	return undefined;
}

export function getReactProps<T>(element: Element): T | undefined {
	for (const k in element) {
		if (k.startsWith("__reactProps")) {
			const props = Reflect.get(element, k);
			return props;
		}
	}
	return undefined;
}
/**
 * Searches the React VDOM tree for a component, starting at the defined node, searching upwards.
 * @param node React VDOM node to start at
 * @param predicate Component predicate to match against
 * @param maxTraversal How far up the tree should we be allowed to travel
 * @param limit Max ammount of components to return
 * @returns Array of found components
 */
export function findComponentParents<T extends ReactExtended.AnyReactComponent>(
	node: ReactExtended.ReactVNode,
	predicate: ReactComponentPredicate,
	maxTraversal = 350,
	limit = Infinity,
): T[] {
	const components: T[] = [];

	let current: ReactExtended.ReactVNode | null = node;

	let travel = 0;
	while (current && components.length < limit && travel <= maxTraversal) {
		if (current.stateNode && current.stateNode instanceof Element == false) {
			const component = current.stateNode as T;
			if (predicate(component)) {
				components.push(component);
			}
		}

		current = current.return;
		travel++;
	}

	return components;
}

/**
 * Searches the React VDOM tree for a component, starting at the defined node, searching downwards across children.
 * @param node React VDOM node to start at
 * @param predicate Component predicate to match against
 * @param maxDepth How far down the branches of the tree should we be allowed to travel.
 * @param limit Max ammount of components to return
 * @returns Array of found components
 */
export function findComponentChildren<T extends ReactExtended.AnyReactComponent>(
	node: ReactExtended.ReactVNode,
	predicate: ReactComponentPredicate,
	maxDepth = 350,
	limit = Infinity,
): T[] {
	const components: T[] = [];

	let current: ReactExtended.ReactVNode | null = node;
	const path: ReactExtended.ReactVNode[] = [];

	for (;;) {
		if (components.length >= limit) break;

		if (!current || path.length > maxDepth) {
			const parent = path.pop();
			if (parent) {
				current = parent.sibling;
				continue;
			} else {
				break;
			}
		}

		if (current.stateNode && current.stateNode instanceof Element == false) {
			const component = current.stateNode as T;
			if (predicate(component)) {
				components.push(component);
			}
		}

		path.push(current);
		current = current.child;
	}

	return components;
}

/**
 * Gets the React VDOM node associated with an element, if there is one.
 * @param el Element
 * @returns VDOM node for the passed element
 */
export function getVNodeFromDOM(el: Node): ReactExtended.ReactVNode | undefined {
	for (const k in el) {
		if (k.startsWith("__reactInternalInstance$") || k.startsWith("__reactFiber$")) {
			return Reflect.get(el, k);
		}
	}
}

/**
 * Finds existing instances of components, if none exist establishes a temporary MutationObserver to wait until a component matching the criteria is found.
 * @param criteria Criteria to match for components
 * @returns Found components
 */
export function awaitComponents<T extends ReactExtended.WritableComponent>(
	criteria: ComponentCriteria,
): PromiseLike<Set<T>> {
	const instances = new Set<T>();

	if (criteria.parentSelector) {
		document.querySelectorAll(criteria.parentSelector).forEach((el) => {
			const node = getVNodeFromDOM(el);
			if (node) {
				findComponentChildren<T>(node, criteria.predicate, criteria.maxDepth).forEach((c) => instances.add(c));
			}
		});
	} else if (criteria.childSelector) {
		document.querySelectorAll(criteria.childSelector).forEach((el) => {
			const node = getVNodeFromDOM(el);
			if (node) {
				findComponentParents<T>(node, criteria.predicate, criteria.maxDepth).forEach((c) => instances.add(c));
			}
		});
	} else {
		const root = getRootVNode();
		if (root)
			findComponentChildren<T>(root, criteria.predicate, criteria.maxDepth).forEach((c) => instances.add(c));
	}

	if (instances.size < 1) {
		return new ObserverPromise<Set<T>>(
			(records, emit) => {
				for (const record of records) {
					record.addedNodes.forEach((node) => {
						if (node instanceof Element) {
							if (!criteria.parentSelector || node.matches(criteria.parentSelector)) {
								const vnode = getVNodeFromDOM(node);
								if (vnode) {
									findComponentChildren<T>(vnode, criteria.predicate, criteria.maxDepth).forEach(
										(c) => instances.add(c),
									);
								}
							} else {
								node.querySelectorAll(criteria.parentSelector).forEach((el) => {
									const node = getVNodeFromDOM(el);
									if (node) {
										findComponentChildren<T>(node, criteria.predicate, criteria.maxDepth).forEach(
											(c) => instances.add(c),
										);
									}
								});
							}
						}
					});
				}

				if (instances.size > 0) emit(instances);
			},
			document,
			{
				subtree: true,
				childList: true,
			},
		);
	}

	return Promise.resolve(instances);
}

/**
 * Creates a component hook and matches against the desired component criteria.
 * Sets a temporary mutation observer if no components matching the criteria currently exist on page.
 * @param criteria Criteria to match for component
 * @param options Options for the hook
 * @returns Hook object for component
 */
export function defineComponentHook<C extends ReactExtended.WritableComponent>(
	criteria: ComponentCriteria,
	options: HookOptions<C> = {},
): ReactComponentHook<C> {
	const retry = () => update();

	const hook: ReactComponentHook<C> = reactive({
		cls: undefined,
		instances: [],
		unhooked: false,
		retry,
	});

	const update = () => {
		if (hook.watcher) {
			hook.watcher.disconnect();
			hook.watcher = undefined;
		}

		const components = awaitComponents(criteria);

		if (components instanceof ObserverPromise) {
			hook.watcher = components;
		}

		components.then(
			(instances) => {
				if (hook.unhooked) return;

				hook.watcher = undefined;

				const [first] = instances;
				if (!first) return;

				const cls = first.constructor as ComponentClass<C>;
				if (!cls) return;

				hook.cls = cls;

				const proto = cls.prototype;

				const createOrGetHook = function (component: C) {
					let instance = Reflect.get(component, WRAPPER_ACCESSOR) as HookedInstance<C>;

					if (!instance) {
						instance = new HookedInstance(component);

						Reflect.set(component, WRAPPER_ACCESSOR, instance);

						hook.instances.push(instance);
					}

					return instance;
				};

				defineFunctionHook(proto, "componentDidMount", function (old, ...args: unknown[]) {
					const instance = createOrGetHook(this);

					options.hooks?.mount?.(instance);

					return old?.apply(this, args);
				});

				defineFunctionHook(proto, "componentDidUpdate", function (old, ...args: unknown[]) {
					const instance = createOrGetHook(this);

					options.hooks?.update?.(instance);

					return old?.apply(this, args);
				});

				defineFunctionHook(proto, "componentWillUnmount", function (old, ...args: unknown[]) {
					const instance = Reflect.get(this, WRAPPER_ACCESSOR) as HookedInstance<C>;
					if (instance) {
						const index = hook.instances.findIndex((x) => x.identifier === instance.identifier);

						if (index > -1) hook.instances.splice(index, 1);

						Reflect.deleteProperty(this, WRAPPER_ACCESSOR);

						options.hooks?.unmount?.(instance);
					}

					return old?.apply(this, args);
				});

				defineFunctionHook(proto, "render", function (old, ...args: unknown[]) {
					const instance = createOrGetHook(this);

					let jsx: React.ReactNode = options.replaceContents ? null : old?.apply(this, args);

					if (options.hooks?.render) jsx = options.hooks.render(instance, jsx);

					if (options.trackRoot) jsx = getTrackedNode(instance, "root", jsx, options.containerClass);

					return jsx;
				});

				defineFunctionHook(proto, "shouldComponentUpdate", function (old, ...args: unknown[]) {
					const instance = createOrGetHook(this);

					if (options.hooks?.shouldUpdate) {
						return options.hooks.shouldUpdate(instance);
					}

					return options.replaceContents ? false : old?.apply(this, args) ?? true;
				});

				if (options.functionHooks) {
					for (const [k, f] of Object.entries(options.functionHooks)) {
						defineFunctionHook(proto, k as keyof C, f);
						for (const instance of instances) {
							defineFunctionHook(instance, k as keyof C, f);
						}
					}
				}

				for (const instance of instances) {
					instance.forceUpdate();
				}
			},
			() => undefined,
		);
	};
	update();

	return hook;
}

/**
 * Unhooks the passed component hook and returns components to their original states
 * @param hook Hook to deactivate
 * @see {@link defineComponentHook}
 */
export function unhookComponent<C extends ReactExtended.WritableComponent>(hook: ReactComponentHook<C>) {
	if (hook.watcher) hook.watcher.disconnect();

	if (hook.cls) {
		const proto = hook.cls.prototype;

		unsetPropertyHook(proto, "componentDidMount");
		unsetPropertyHook(proto, "componentDidUpdate");
		unsetPropertyHook(proto, "componentWillUnmount");
		unsetPropertyHook(proto, "render");
		unsetPropertyHook(proto, "shouldComponentUpdate");
	}

	for (const instance of hook.instances) {
		instance.component.forceUpdate();
	}

	hook.cls = undefined;
	hook.instances.length = 0;
	hook.watcher = undefined;
	hook.unhooked = true;
}

/**
 * Creates a watched React ref to track node instances from React VDOM
 * @param hook Hooked instance to track on
 * @param name Tracked name for element
 * @returns React ref to be set on ReactNode
 */
export function getTrackedReactRef<C extends ReactExtended.WritableComponent>(hook: HookedInstance<C>, name: string) {
	const ref: { current: Element | null } = { current: null };

	definePropertyHook(ref, "current", {
		value: (v) => {
			if (v == null) {
				delete hook.domNodes[name];
			} else {
				hook.domNodes[name] = v;
			}
		},
	});

	return ref;
}

/**
 * Creates a tracker node for the given ReactNode using a watched React ref
 * @param hook Hooked instance to track on
 * @param name Tracked name for node
 * @param node Node to track
 * @returns Tracker node
 * @see {@link getTrackedReactRef}
 */
export function getTrackedNode<C extends ReactExtended.WritableComponent>(
	hook: HookedInstance<C>,
	name: string,
	node?: React.ReactNode,
	className?: string,
): ReactExtended.ReactRuntimeElement {
	return {
		$$typeof: REACT_ELEMENT_SYMBOL,
		key: null,
		ref: getTrackedReactRef(hook, name),
		type: "seventv-container",
		props: {
			children: node ?? null,
			class: className,
		},
	};
}

/**
 * Helper Composable for using component hooks inside of Vue components
 * @see {@link defineComponentHook}
 */
export function useComponentHook<C extends ReactExtended.WritableComponent>(
	criteria: ComponentCriteria,
	options?: HookOptions<C>,
): ReactComponentHook<C> {
	const hook = defineComponentHook<C>(criteria, options);

	onUnmounted(() => {
		if (options?.functionHooks) {
			for (const k of Object.keys(options.functionHooks)) {
				if (hook.cls) {
					unsetPropertyHook(hook.cls.prototype, k as keyof C);
				}
				for (const instance of hook.instances) {
					unsetPropertyHook(instance.component, k as keyof C);
				}
			}
		}
		unhookComponent(hook);
	});

	return hook;
}

export function findElementFiber<P>(
	options: ComponentCriteria<ReactExtended.ReactFunctionalFiber<P>>,
): ReactExtended.ReactFunctionalFiber<P> | undefined {
	let current: ReactExtended.ReactVNode | undefined;

	if (options.parentSelector || options.childSelector) {
		const el = document.querySelector(options.parentSelector! || options.childSelector!);
		if (!el) return;

		current = getVNodeFromDOM(el);
	} else {
		current = getRootVNode();
	}

	const maxDepth = options?.maxDepth ?? 20;
	for (let i = 0; i < maxDepth; i++) {
		const next = options.parentSelector || !options.childSelector ? current?.child : current?.return;
		if (!next) break;

		if (current?.elementType && options.predicate(current as unknown as ReactExtended.ReactFunctionalFiber<P>))
			break;

		current = next;
	}

	return current as unknown as ReactExtended.ReactFunctionalFiber<P>;
}

export async function awaitElementFiber<P>(
	options: ComponentCriteria<ReactExtended.ReactFunctionalFiber<P>>,
): Promise<ReactExtended.ReactFunctionalFiber<P>> {
	let fiber = findElementFiber<P>(options);

	if (!fiber) {
		fiber = await new Promise<ReactExtended.ReactFunctionalFiber<P>>((resolve) => {
			const observer = new MutationObserver((records) => {
				for (const record of records) {
					if (!record.addedNodes) continue;

					record.addedNodes.forEach((node) => {
						if (node instanceof Element) {
							const fiber = findElementFiber<P>(options);

							if (fiber) {
								resolve(fiber);
								observer.disconnect();
							}
						}
					});
				}
			});
			observer.observe(document, { childList: true, subtree: true });
		});
	}

	return fiber;
}

export function useElementFiberHook<P extends object>(
	criteria: ComponentCriteria<ReactExtended.ReactFunctionalFiber<P>>,
	options?: FiberHookOptions<P>,
): void {
	const fiber = awaitElementFiber<P>(criteria);

	fiber.then((fiber) => {
		if (options?.hooks?.render) {
			defineFunctionHook(fiber.elementType, "render", options.hooks.render);
			options.hooks.render.call(fiber.elementType, null, fiber.pendingProps);

			onUnmounted(() => {
				unsetPropertyHook(fiber.elementType, "render");
			});
		}
	});
}

type RenderFunction<P extends object> = (props: P, ref?: React.RefObject<Element>) => ReactExtended.ReactRuntimeElement;

type HookedElementFunction<
	P extends object,
	E extends ReactExtended.ReactFunctionalFiber<P> = ReactExtended.ReactFunctionalFiber<P>,
> = (
	this: E["elementType"],
	old: RenderFunction<P> | null,
	props: P,
	ref?: React.RefObject<Element>,
) => ReactExtended.ReactRuntimeElement | null;

interface ComponentCriteria<C = ReactExtended.AnyReactComponent> {
	parentSelector?: string;
	childSelector?: string;
	predicate: ReactComponentPredicate<C>;
	maxDepth?: number;
}

interface HookOptions<C extends ReactExtended.WritableComponent> {
	replaceContents?: boolean;
	trackRoot?: boolean;
	containerClass?: string;
	hooks?: {
		mount?: (inst: HookedInstance<C>) => void;
		update?: (inst: HookedInstance<C>) => void;
		unmount?: (inst: HookedInstance<C>) => void;
		shouldUpdate?: (inst: HookedInstance<C>) => boolean;
		render?: (inst: HookedInstance<C>, current: React.ReactNode) => React.ReactNode;
	};
	functionHooks?: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[F in keyof C]?: C[F] extends (...args: any[]) => any
			? (this: C, old: C[F], ...args: Parameters<C[F]>) => ReturnType<C[F]>
			: never;
	};
}

interface FiberHookOptions<P extends object> {
	hooks?: {
		render?: HookedElementFunction<P>;
	};
}

interface ComponentClass<C extends ReactExtended.WritableComponent> {
	new (): C;
	prototype: C;
}

export interface ReactComponentHook<C extends ReactExtended.WritableComponent> {
	cls: ComponentClass<C> | undefined;
	instances: HookedInstance<C>[];
	watcher?: ObserverPromise<Set<C>>;
	unhooked: boolean;
	retry: () => void;
}

export class HookedInstance<C extends ReactExtended.WritableComponent> {
	public readonly identifier: symbol;
	public readonly component: C;
	public readonly domNodes: Record<string, Element>;

	constructor(component: C) {
		this.identifier = Symbol();
		this.component = component;
		this.domNodes = reactive({});
	}
}

export type ReactComponentPredicate<C = ReactExtended.AnyReactComponent> = (component: C) => boolean;
