import type { Dexie7 } from "./idb";

export function defineVersions(db: Dexie7) {
	db.version(2.0).stores({
		channels: "id,timestamp",
		emoteSets: "id,timestamp,owner.id,priority,provider",
		emotes: "id,timestamp,name,owner.id",
		cosmetics: "id,timestamp",
		entitlements: "id,timestamp,cid",
		settings: "key",
	});
}
