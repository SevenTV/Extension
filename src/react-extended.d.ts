/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/prefer-namespace-keyword */

declare namespace ReactExtended {
	type AnyReactComponent = WritableComponent<any, any> & { [x: string]: any };

	type WritableComponent<P = {}, S = {}, SS = any> = React.Component<P, S, SS> & {
		props: Writeable<React.Component<P, S, SS>["props"]>;
		state: Writeable<React.Component<P, S, SS>["state"]>;
	};

	type Writeable<T> = { -readonly [P in keyof T]: Writeable<T[P]> };

	interface ReactVNode {
		alternate: ReactVNode | null;
		child: ReactVNode | null;
		childExpirationTime: number | null;
		effectTag: number | null;
		elementType: React.ElementType | null;
		expirationTime: number | null;
		index: number | null;
		key: Key | null;
		mode: number | null;
		return: ReactVNode | null;
		sibling: ReactVNode | null;
		stateNode: React.ReactInstance | null;
		tag: number | null;
		type: React.ElementType | null;
	}

	interface ReactRuntimeElement extends React.ReactElement {
		$$typeof: symbol;
		ref: { current: Element | null } | null;
	}
}
