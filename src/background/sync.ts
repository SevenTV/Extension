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

chrome.tabs.onUpdated.addListener((id, i) => {
	if (i.status !== "complete") return;

	// wait a few seconds then send extension-stored settings
	// the site will decide if these nodes are more up to date than its own set
	setTimeout(() => {
		if (typeof id !== "number") return;

		chrome.tabs.sendMessage(id, {
			type: "settings-sync",
			data: { settings },
		});
	}, 5000);
});

main();
