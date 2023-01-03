import { log } from "@/common/Logger";
import { DBCoreMutateRequest, Dexie, PromiseExtended, Table, DexieError } from "dexie";
import { defineVersions } from "./versions.idb";

export class Dexie7 extends Dexie {
	VERSION = 1.7;

	private _ready = false;

	channels!: Table<ChannelMapping & WithTimestamp, SevenTV.ObjectID>;
	emoteSets!: Table<SevenTV.EmoteSet & WithTimestamp, SevenTV.ObjectID>;
	emotes!: Table<SevenTV.Emote & WithTimestamp, SevenTV.ObjectID>;
	cosmetics!: Table<SevenTV.Cosmetic & WithTimestamp, SevenTV.ObjectID>;
	entitlements!: Table<SevenTV.Entitlement & WithTimestamp, SevenTV.ObjectID>;
	settings!: Table<SevenTV.Setting<SevenTV.SettingType>>;

	constructor() {
		const dbName = ["seventv"];
		if (import.meta.env.MODE && import.meta.env.MODE !== "production") {
			dbName.push(import.meta.env.MODE);
		}

		super(dbName.join("_"), {
			autoOpen: false,
		});

		defineVersions(this);

		this.use({
			name: "SetDocumentTimestamps",
			stack: "dbcore",
			create(down) {
				return {
					...down,
					table(name) {
						const downTable = down.table(name);

						return {
							...downTable,
							mutate(req: Transaction<WithTimestamp>) {
								if (req.type === "put" && Array.isArray(req.values)) {
									const now = Date.now();

									req.values = req.values.map((v) => ({
										...v,
										timestamp: now,
									}));
								}

								return downTable.mutate(req as DBCoreMutateRequest);
							},
						};
					},
				};
			},
		});
	}

	async ready(): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			if (this._ready) return resolve(true);

			// Handle errors in opening the DB
			const onError = async (err: Error) => {
				reject(err);

				log.error("<IDB>", "Failed to open database", err.toString());

				// VersionError: delete the DB
				if ((err as DexieError).name === "VersionError") {
					log.error("<IDB>", `!! Versioning issue detected. This will not work. (IndexedDB/${db.name}) !!`);
				}
			};

			this.open()
				.then(() => {
					resolve(true);
				})
				.catch(onError);
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

	async expireDocuments(exemptChannels?: string[]): Promise<void> {
		const now = Date.now();
		const oneHour = 1000 * 60 * 60;

		log.info(
			"<IDB>",
			"Expiring old documents",
			exemptChannels?.length ? `exceptions=${exemptChannels?.join(",") ?? 0}` : "",
		);

		// Clean up channels & emote sets
		{
			// Get channels to be expired
			const channels = await this.channels
				.where("timestamp")
				.below(now - oneHour)
				.and((c) => !exemptChannels?.includes(c.id))
				.toArray();

			// Expire emote sets
			this.emoteSets
				.where("id")
				.anyOf(channels.map((c) => c.set_ids).reduce((a, b) => a.concat(b), []))
				.delete();

			// Delete channels
			this.channels
				.where("id")
				.anyOf(channels.map((c) => c.id))
				.delete();
		}
	}
}

export const db = new Dexie7();

export interface ChannelMapping {
	id: string;
	set_ids: SevenTV.ObjectID[];
}

interface WithTimestamp {
	timestamp?: number;
}

interface Transaction<T> {
	trans: DBCoreMutateRequest["trans"];
	type: DBCoreMutateRequest["type"];
	values?: T[];
}
