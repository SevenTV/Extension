import { Dexie7 } from "@/db/idb";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

function defineVersions(d: Dexie): void {
	d.version(2.4).stores({
		channels: "id,timestamp",
		emoteSets: "id,timestamp,priority,provider,scope",
		emotes: "id,timestamp,name,owner.id",
		cosmetics: "id,timestamp",
		entitlements: "id,scope,timestamp,user_id",
		settings: "key",
	});
	d.version(2.5).stores({
		channels: "id,timestamp",
		emoteSets: "id,timestamp,priority,provider,scope",
		emotes: "id,timestamp,name,owner.id",
		cosmetics: "id,timestamp,kind",
		entitlements: "id,scope,timestamp,user_id",
		settings: "key",
	});
	d.version(2.6).stores({
		channels: "id,timestamp",
		emoteSets: "id,timestamp,priority,provider,scope",
		emotes: "id,timestamp,name,owner.id",
		cosmetics: "id,timestamp,kind",
		entitlements: "id,scope,timestamp,user_id,platform_id",
		settings: "key",
	});
}

let db: Dexie7;
let seed: Dexie;

beforeEach(async () => {
	db = new Dexie7();
	seed = new Dexie(db.name);
	defineVersions(seed);
	await seed.open();
	await db.open();
});

afterEach(async () => {
	await seed.close();
	await db.delete();
});

async function putChannel(id: string, set_ids: string[], timestamp: number): Promise<void> {
	await seed.channels.put({ id, platform: "TWITCH", set_ids, timestamp });
}

async function putEmoteSet(id: string, opts: { scope?: string; timestamp: number }): Promise<void> {
	await seed.emoteSets.put({
		id,
		provider: "7TV",
		scope: opts.scope ?? "CHANNEL",
		priority: 3,
		emotes: [],
		tags: [],
		immutable: false,
		privileged: false,
		flags: 0,
		timestamp: opts.timestamp,
	});
}

const HOUR = 3600 * 1000;

describe("Dexie7.expireDocuments", () => {
	it("does not delete global emote sets that are older than 1h", async () => {
		await putEmoteSet("global7tv", { scope: "GLOBAL", timestamp: Date.now() - 2 * HOUR });

		await db.expireDocuments([]);

		expect(await db.emoteSets.get("global7tv")).toBeTruthy();
	});

	it("does not delete emote sets referenced by an exempt (active) channel", async () => {
		await putChannel("X", ["setX"], Date.now() - 2 * HOUR);
		await putEmoteSet("setX", { timestamp: Date.now() - 2 * HOUR });

		await db.expireDocuments(["X"]);

		expect(await db.channels.get("X")).toBeTruthy();
		expect(await db.emoteSets.get("setX")).toBeTruthy();
	});

	it("deletes stale emote sets of channels that are no longer active", async () => {
		await putChannel("Z", ["setZ"], Date.now() - 2 * HOUR);
		await putEmoteSet("setZ", { timestamp: Date.now() - 2 * HOUR });

		await db.expireDocuments([]);

		expect(await db.channels.get("Z")).toBeFalsy();
		expect(await db.emoteSets.get("setZ")).toBeFalsy();
	});

	it("keeps fresh emote sets intact", async () => {
		await putChannel("Y", ["setY"], Date.now());
		await putEmoteSet("setY", { timestamp: Date.now() });

		await db.expireDocuments([]);

		expect(await db.channels.get("Y")).toBeTruthy();
		expect(await db.emoteSets.get("setY")).toBeTruthy();
	});

	it("regression: opening a new tab does not wipe emotes for already-open tabs", async () => {
		await putChannel("X", ["setX"], Date.now() - 2 * HOUR);
		await putEmoteSet("setX", { timestamp: Date.now() - 2 * HOUR });
		await putEmoteSet("global7tv", { scope: "GLOBAL", timestamp: Date.now() - 2 * HOUR });
		await putChannel("Y", ["setY"], Date.now());
		await putEmoteSet("setY", { timestamp: Date.now() });
		await putChannel("Z", ["setZ"], Date.now() - 2 * HOUR);
		await putEmoteSet("setZ", { timestamp: Date.now() - 2 * HOUR });

		await db.expireDocuments(["X", "Y"]);

		const channelIDs = (await db.channels.toArray()).map((c) => c.id).sort();
		const setIDs = (await db.emoteSets.toArray()).map((s) => s.id).sort();

		expect(channelIDs).toEqual(["X", "Y"]);
		expect(setIDs).toEqual(["global7tv", "setX", "setY"]);
	});
});

describe("Dexie7.ready", () => {
	it("resolves to true once the database can be opened", async () => {
		await expect(db.ready()).resolves.toBe(true);
	});

	it("resolves on subsequent calls after a successful open", async () => {
		await db.ready();
		await expect(db.ready()).resolves.toBe(true);
	});
});
