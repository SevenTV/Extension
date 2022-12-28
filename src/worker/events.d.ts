import type { Dexie7 } from "@/db/IndexedDB";
import type { EventAPI } from "./net.events.worker";

export interface ChangeMap<K extends SevenTV.ObjectKind> {
	id: string;
	kind: SevenTV.ObjectKind;
	contextual?: boolean;
	actor: SevenTV.User;
	added: ChangeFieldOf<K>[];
	updated: ChangeFieldOf<K>[];
	removed: ChangeFieldOf<K>[];
	pushed: ChangeFieldOf<K>[];
	pulled: ChangeFieldOf<K>[];
	object: ObjectTypeOfKind[K];
}

export interface ChangeField<KEY extends string> {
	key: KEY;
	index: number | null;
	nested?: boolean;
	type: string;
	old_value?: unknown;
	value: unknown;
}

type ObjectType = SevenTV.User | SevenTV.Emote | SevenTV.EmoteSet;

type ObjectTypeOfKind = {
	[SevenTV.ObjectKind.USER]: SevenTV.User;
	[SevenTV.ObjectKind.EMOTE]: SevenTV.Emote;
	[SevenTV.ObjectKind.EMOTE_SET]: SevenTV.EmoteSet;
	[SevenTV.ObjectKind.ROLE]: unknown;
	[SevenTV.ObjectKind.ENTITLEMENT]: unknown;
	[SevenTV.ObjectKind.BAN]: unknown;
	[SevenTV.ObjectKind.MESSAGE]: unknown;
	[SevenTV.ObjectKind.REPORT]: unknown;
};

type ChangeFieldOf<K extends SevenTV.ObjectKind> = ChangeField<keyof ObjectTypeOfKind[K]>;

export interface EventContext {
	eventAPI: EventAPI;
	db: Dexie7;
}

export interface WebSocketPayload<T> {
	op: number;
	t?: number;
	d: T;
}

export namespace Payload {
	export interface Hello {
		session_id: string;
		heartbeat_interval: number;
		subscription_limit: number;
	}

	export interface Dispatch {
		type: string;
		body: ChangeMap<SevenTV.ObjectKind>;
	}
}
