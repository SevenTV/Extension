// NetCache uses IndexedDB to share data across all browser instances

import { Dexie, PromiseExtended, Table } from "dexie";

export class Dexie7 extends Dexie {
	VERSION = 1.5;

	private _ready = false;

	channels!: Table<ChannelMapping, SevenTV.ObjectID>;
	emoteSets!: Table<SevenTV.EmoteSet, SevenTV.ObjectID>;
	emotes!: Table<SevenTV.Emote, SevenTV.ObjectID>;
	users!: Table<SevenTV.User, SevenTV.ObjectID>;
	userConnections!: Table<SevenTV.UserConnection, SevenTV.ObjectID>;
	settings!: Table<SevenTV.Setting<SevenTV.SettingType>>;

	constructor() {
		super("SevenTV", {
			autoOpen: false,
		});

		this.version(this.VERSION).stores({
			channels: "id",
			emoteSets: "id,owner.id,priority,provider",
			emotes: "id,name,owner.id",
			users: "id,username,connections.id,connections.username",
			userConnections: "id,platform,username,emote_set.id",
			settings: "key",
		});
	}

	async ready(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			if (this._ready) return resolve(true);

			this.open().then(() => {
				resolve(true);
			});
		});
	}

	async withErrorFallback<T, T2>(promise: PromiseExtended<T>, ifError: () => PromiseExtended<T2>): Promise<T | T2> {
		return new Promise<T | T2>((resolve, reject) => {
			promise
				.then((res) => resolve(res))
				.catch(() => {
					ifError()
						.then((res) => resolve(res))
						.catch((err) => reject(err));
				});
		});
	}
}

export const db = new Dexie7();

export interface ChannelMapping {
	id: string;
	set_ids: SevenTV.ObjectID[];
}
