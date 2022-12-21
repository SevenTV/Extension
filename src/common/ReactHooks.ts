import { defineFunctionHook, definePropertyHook, unsetPropertyHook } from "@/common/Reflection";
import { onUnmounted, reactive } from "vue";
import { ObserverPromise } from "@/common/Async";

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

	const root = Reflect.get(element, "_reactRootContainer");

	return root?._internalRoot?.current;
}

/**
 * Searches the React VDOM tree for a component, starting at the defined node, searching upwards.
 * @param node React VDOM node to start at
 * @param predicate Component predicate to match against
 * @param maxTraversal How far up the tree should we be allowed to travel
 * @param limit Max ammount of components to return
 * @returns Array of found components
 */
export function findComponentParents(
	node: ReactExtended.ReactVNode,
	predicate: ReactComponentPredicate,
	maxTraversal = 1000,
	limit = Infinity,
): ReactExtended.AnyReactComponent[] {
	const components: ReactExtended.AnyReactComponent[] = [];

	let current: ReactExtended.ReactVNode | null = node;

	let travel = 0;
	while (current && components.length < limit && travel <= maxTraversal) {
		if (current.stateNode && current.stateNode instanceof Element == false) {
			const component = current.stateNode as ReactExtended.AnyReactComponent;
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
export function findComponentChildren(
	node: ReactExtended.ReactVNode,
	predicate: ReactComponentPredicate,
	maxDepth = 1000,
	limit = Infinity,
): ReactExtended.AnyReactComponent[] {
	const components: ReactExtended.AnyReactComponent[] = [];

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
			const component = current.stateNode as ReactExtended.AnyReactComponent;
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
		if (k.startsWith("__reactInternalInstance$")) {
			return Reflect.get(el, k);
		}
	}
}

/**
 * Finds existing instances of components, if none exist establishes a temporary MutationObserver to wait until a component matching the criteria is found.
 * @param criteria Criteria to match for components
 * @returns Found components
 */
export function awaitComponents(criteria: ComponentCriteria): PromiseLike<Set<ReactExtended.WritableComponent>> {
	const instances = new Set<ReactExtended.WritableComponent>();

	if (criteria.parentSelector) {
		document.querySelectorAll(criteria.parentSelector).forEach((el) => {
			const node = getVNodeFromDOM(el);
			if (node) {
				findComponentChildren(node, criteria.predicate).forEach((c) => instances.add(c));
			}
		});
	} else {
		const root = getRootVNode();
		if (root) findComponentChildren(root, criteria.predicate).forEach((c) => instances.add(c));
	}

	if (instances.size < 1) {
		return new ObserverPromise<Set<ReactExtended.WritableComponent>>(
			(records, emit) => {
				for (const record of records) {
					record.addedNodes.forEach((node) => {
						if (node instanceof Element) {
							if (!criteria.parentSelector || node.matches(criteria.parentSelector)) {
								const vnode = getVNodeFromDOM(node);
								if (vnode) {
									findComponentChildren(vnode, criteria.predicate).forEach((c) => instances.add(c));
								}
							} else {
								node.querySelectorAll(criteria.parentSelector).forEach((el) => {
									const node = getVNodeFromDOM(el);
									if (node) {
										findComponentChildren(node, criteria.predicate).forEach((c) =>
											instances.add(c),
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
	const hook: ReactComponentHook<C> = reactive({
		cls: undefined,
		instances: [],
		unhooked: false,
	});

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

				if (options.trackRoot) jsx = getTrackedNode(instance, "root", jsx);

				return jsx;
			});

			defineFunctionHook(proto, "shouldComponentUpdate", function (old, ...args: unknown[]) {
				const instance = createOrGetHook(this);

				if (options.hooks?.shouldUpdate) {
					return options.hooks.shouldUpdate(instance);
				}

				return options.replaceContents ? false : old?.apply(this, args) ?? true;
			});

			for (const instance of instances) {
				instance.forceUpdate();
			}
		},
		() => undefined,
	);

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
			hook.domNodes[name] = v;
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
): ReactExtended.ReactRuntimeElement {
	return {
		$$typeof: REACT_ELEMENT_SYMBOL,
		key: null,
		ref: getTrackedReactRef(hook, name),
		type: "seventv-container",
		props: {
			children: node ?? null,
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

	onUnmounted(() => unhookComponent(hook));

	return hook;
}

interface ComponentCriteria {
	parentSelector?: string;
	predicate: ReactComponentPredicate;
}

interface HookOptions<C extends ReactExtended.WritableComponent> {
	replaceContents?: boolean;
	trackRoot?: boolean;
	hooks?: {
		mount?: (inst: HookedInstance<C>) => void;
		update?: (inst: HookedInstance<C>) => void;
		unmount?: (inst: HookedInstance<C>) => void;
		shouldUpdate?: (inst: HookedInstance<C>) => boolean;
		render?: (inst: HookedInstance<C>, current: React.ReactNode) => React.ReactNode;
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

export type ReactComponentPredicate = (component: ReactExtended.AnyReactComponent) => boolean;
