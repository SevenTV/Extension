export class ExtendedPromise<V> implements PromiseLike<V> {
	protected isResolved = false;
	protected resolve?: (value: V | PromiseLike<V>) => void;
	protected reject?: (reason?: Error) => void;

	public then: Promise<V>["then"];
	public catch: Promise<V>["catch"];
	public finally: Promise<V>["finally"];

	constructor() {
		const promise = new Promise<V>((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.then = (...args: any[]) => promise.then(...args);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.catch = (...args: any[]) => promise.catch(...args);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.finally = (...args: any[]) => promise.finally(...args);
	}

	protected emit(v: V) {
		this.isResolved = true;
		this.resolve?.(v);

		this.resolve = undefined;
		this.reject = undefined;
	}
}

export class ObserverPromise<V> extends ExtendedPromise<V> {
	private observer: MutationObserver | undefined;

	constructor(
		callback: (mutations: MutationRecord[], emit: (v: V) => void) => void,
		target: Node,
		options?: MutationObserverInit,
	) {
		super();

		this.observer = new MutationObserver((mutations) => {
			callback(mutations, this.emit.bind(this));
		});

		this.observer.observe(target, options);
	}

	protected emit(v: V) {
		super.emit(v);

		this.disconnect();
	}

	disconnect() {
		this.observer?.disconnect();
		this.observer = undefined;

		if (!this.isResolved) {
			this.reject?.(new ObserverPromiseNotResolvedError());
		}
	}
}

export class ObserverPromiseNotResolvedError extends Error {
	constructor() {
		super("ObserverPromise: Observer disconnected before resolving.");
	}
}
