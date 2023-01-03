import type { LogType } from "@/common/Logger";
import type { Dexie7 } from "@/db/idb";
import { WorkerDriver } from "./worker.driver";
import type { EventAPI } from "./worker.events";

export interface WorkerMessage<T extends WorkerMessageType> {
	type: WorkerMessageType;
	data: TypedWorkerMessage<T>;
}

export enum workerMessageType {
	INIT,
	STATE,
	LOG,
	CLOSE,
	CHANNEL_FETCHED,
	CHANNEL_ACTIVE_CHATTER,
}

export type WorkerMessageType = keyof typeof workerMessageType;

export type TypedWorkerMessage<T extends WorkerMessageType> = {
	INIT: object;
	STATE: Partial<{
		platform: Platform;
		identity: TwitchIdentity | YouTubeIdentity | null;
		user: SevenTV.User | null;
		channel: CurrentChannel | null;
	}>;
	LOG: {
		type: LogType;
		text: string[];
		css: string[];
		objects: object[];
	};
	CLOSE: object;
	CHANNEL_FETCHED: {
		channel: CurrentChannel;
	};
	CHANNEL_ACTIVE_CHATTER: {
		channel_id: string;
	};
}[T];

export interface EventAPIMessage<O extends keyof typeof EventAPIOpCode> {
	op: O;
	data: EventAPIMessageData<O>;
}
export interface EventContext {
	driver: WorkerDriver;
	eventAPI: EventAPI;
	db: Dexie7;
}

export enum EventAPIOpCode {
	DISPATCH = 0,
	HELLO = 1,
	HEARTBEAT = 2,
	RECONNECT = 4,
	ACK = 5,
	ERROR = 6,
	ENDOFSTREAM = 7,
	IDENTIFY = 33,
	RESUME = 34,
	SUBSCRIBE = 35,
	UNSUBSCRIBE = 36,

	UNKNOWN = 1001,
}

export type EventAPIMessageData<O extends keyof typeof EventAPIOpCode> = {
	DISPATCH: {
		type: string;
		body: ChangeMap<SevenTV.ObjectKind>;
	};
	HELLO: {
		session_id: string;
		heartbeat_interval: number;
	};
	HEARTBEAT: {
		count: number;
	};
	RECONNECT: void;
	ACK: {
		command: string;
		data: unknown;
	};
	ERROR: {
		code: number;
		message: string;
	};
	ENDOFSTREAM: void;
	IDENTIFY: void;
	RESUME: void;
	SUBSCRIBE: {
		type: string;
		condition: Record<string, string>;
	};
	UNSUBSCRIBE: {
		type: string;
		condition: Record<string, string>;
	};
	UNKNOWN: unknown;
}[O];

export interface ChangeMap<K extends SevenTV.ObjectKind> {
	id: string;
	kind: SevenTV.ObjectKind;
	contextual?: boolean;
	actor: SevenTV.User;
	added: ChangeField[];
	updated: ChangeField[];
	removed: ChangeField[];
	pushed: ChangeField[];
	pulled: ChangeField[];
	object: ObjectTypeOfKind[K];
}

export type ObjectType = SevenTV.User | SevenTV.Emote | SevenTV.EmoteSet;

export type ObjectTypeOfKind = {
	[SevenTV.ObjectKind.USER]: SevenTV.User;
	[SevenTV.ObjectKind.EMOTE]: SevenTV.Emote;
	[SevenTV.ObjectKind.EMOTE_SET]: SevenTV.EmoteSet;
	[SevenTV.ObjectKind.ROLE]: unknown;
	[SevenTV.ObjectKind.ENTITLEMENT]: SevenTV.Entitlement;
	[SevenTV.ObjectKind.BAN]: unknown;
	[SevenTV.ObjectKind.MESSAGE]: unknown;
	[SevenTV.ObjectKind.REPORT]: unknown;
	[SevenTV.ObjectKind.PRESENCE]: unknown;
	[SevenTV.ObjectKind.COSMETIC]: SevenTV.Cosmetic;
};

export interface ChangeField {
	key: string;
	index: number | null;
	nested?: boolean;
	type: string;
	old_value?: unknown;
	value: unknown;
}

export interface SubscriptionData {
	type: string;
	condition: Record<string, string>;
}
