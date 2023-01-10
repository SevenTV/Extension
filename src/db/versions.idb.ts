import type { Dexie7 } from "./idb";

export function defineVersions(db: Dexie7) {
	db.version(2.3).stores({
		channels: "id,timestamp",
		emoteSets: "id,timestamp,priority,provider",
		emotes: "id,timestamp,name,owner.id",
		cosmetics: "id,timestamp",
		entitlements: "id,scope,timestamp,user_id",
		settings: "key",
	});
}
