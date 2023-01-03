export type TypedEventListenerOrEventListenerObject<T extends Event> =
	| TypedEventListener<T>
	| TypedEventListenerObject<T>;

interface TypedEventListener<T extends Event> {
	(evt: T): void;
}

interface TypedEventListenerObject<T extends Event> {
	handleEvent(object: T): void;
}
