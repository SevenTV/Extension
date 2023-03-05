import { db } from "@/db/idb";
import { liveQuery } from "dexie";

const settings = [] as SevenTV.Setting<SevenTV.SettingType>[];

async function main() {
	await db.ready();

	// TODO
	// IDB Syncing Mechanism
	//
	// This synchronizes settings across sites
	liveQuery(() => db.settings.toArray()).subscribe({
		next(value) {
			settings.length = 0;
			settings.push(...value);
		},
	});
}

main();
