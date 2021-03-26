export class EmoteStore {
	private cachedElements = new Map<string, JSX.Element>();

	addElement(name: string, jsx: JSX.Element): JSX.Element {
		this.cachedElements.set(name, jsx);

		return jsx;
	}

	getElement(name: string): JSX.Element | undefined {
		return this.cachedElements.get(name);
	}
}
