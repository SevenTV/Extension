import "fake-indexeddb/auto";

if (typeof globalThis.CustomEvent === "undefined") {
	class CustomEvent extends Event {
		detail: unknown;

		constructor(type: string, eventInitDict?: EventInit & { detail?: unknown }) {
			super(type, eventInitDict);
			this.detail = eventInitDict?.detail;
		}
	}

	(globalThis as typeof globalThis & { CustomEvent?: typeof CustomEvent }).CustomEvent = CustomEvent;
}
