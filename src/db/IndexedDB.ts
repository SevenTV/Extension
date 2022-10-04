// NetCache uses IndexedDB to share data across all browser instances

import { Dexie, Table } from "dexie";

export class Dexie7 extends Dexie {
	VERSION = 1.06;

	emoteSets!: Table<SevenTV.EmoteSet, SevenTV.ObjectID>;
	emotes!: Table<SevenTV.Emote, SevenTV.ObjectID>;
	users!: Table<SevenTV.User, SevenTV.ObjectID>;
	userConnections!: Table<SevenTV.UserConnection, SevenTV.ObjectID>;

	constructor() {
		super("SevenTV");

		this.version(this.VERSION).stores({
			emoteSets: "id,name,owner.id,provider",
			emotes: "id,name,owner.id",
			users: "id,username,connections.id,connections.username",
			userConnections: "id,platform,username,emote_set.id",
		});
	}
}

export const db = new Dexie7();
