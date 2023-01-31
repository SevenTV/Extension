import type { Dexie7 } from "./idb";

export function defineVersions(db: Dexie7) {
	db.version(2.4).stores({
		channels: "id,timestamp",
		emoteSets: "id,timestamp,priority,provider,scope",
		emotes: "id,timestamp,name,owner.id",
		cosmetics: "id,timestamp",
		entitlements: "id,scope,timestamp,user_id",
		settings: "key",
	});

	db.version(2.5).stores({
		channels: "id,timestamp",
		emoteSets: "id,timestamp,priority,provider,scope",
		emotes: "id,timestamp,name,owner.id",
		cosmetics: "id,timestamp,kind",
		entitlements: "id,scope,timestamp,user_id",
		settings: "key",
	});
}
