// REST Helpers
// Fetches initial data from API

import { log } from "@/common/Logger";
import { convertBttvEmoteSet, convertFFZEmoteSet } from "@/common/Transform";
import { db } from "@/db/idb";
import type { WorkerDriver } from "./worker.driver";
import type { WorkerPort } from "./worker.port";

namespace API_BASE {
	export const SEVENTV = import.meta.env.VITE_APP_API_REST;
	export const FFZ = "https://api.frankerfacez.com/v1";
	export const BTTV = "https://api.betterttv.net/3";
}

enum ProviderPriority {
	BTTV,
	FFZ,
	SEVENTV,
	TWITCH,
}

export class WorkerHttp {
	constructor(private driver: WorkerDriver) {
		this.driver = driver;

		driver.addEventListener("start_watching_channel", (ev) => this.fetchChannelData(ev.detail, ev.port));
		driver.addEventListener("identity_updated", async (ev) => {
			const user = await this.API().seventv.loadUserData(ev.port?.platform ?? "TWITCH", ev.detail.id);
			if (user && ev.port) {
				ev.port.user = user;
			}
		});
		driver.addEventListener("set_channel_presence", (ev) => {
			if (!ev.port || !ev.port.platform || !ev.port.user || !ev.port.channel) return;

			this.API().seventv.writePresence(ev.port.platform, ev.port.user.id, ev.port.channel.id);
		});
	}

	public async fetchChannelData(channel: CurrentChannel, port?: WorkerPort) {
		await this.driver.db.ready();

		this.driver.log.debug(`<Net/Http> fetching channel data for #${channel.username}`);

		// store the channel into IDB
		await db.withErrorFallback(db.channels.put({ id: channel.id, set_ids: [] }), () =>
			db.channels.where("id").equals(channel.id).modify(channel),
		);

		// setup fetching promises
		const promises = [
			["7TV", seventv.loadUserEmoteSet("TWITCH", channel.id).catch(() => void 0)],
			["FFZ", frankerfacez.loadUserEmoteSet(channel.id).catch(() => void 0)],
			["BTTV", betterttv.loadUserEmoteSet(channel.id).catch(() => void 0)],
		] as [string, Promise<SevenTV.EmoteSet>][];

		const onResult = async (set: SevenTV.EmoteSet) => {
			if (!set) return;

			// store set to DB
			await db.withErrorFallback(db.emoteSets.put(set), () =>
				db.emoteSets.where({ id: set.id, provider: set.provider }).modify(set),
			);

			// add set ID to the channel
			await db.channels
				.where("id")
				.equals(channel.id)
				.modify((x) => x.set_ids.push(set.id));
		};

		// iterate results and store sets to DB
		const sets = [] as SevenTV.EmoteSet[];
		for (const [provider, setP] of promises) {
			const set = await setP.catch((err) =>
				this.driver.log.error(
					`<Net/Http> failed to load emote set from provider ${provider} in #${channel.username}`,
					err,
				),
			);
			if (!set) continue;

			sets.push(set);
			await onResult(set);
		}

		if (port) {
			// Post channel fetch notification back to port
			port.postMessage("CHANNEL_FETCHED", {
				channel,
			});
		}

		// begin subscriptions to channel emote sets
		for (const set of sets) {
			this.driver.eventAPI.subscribe("emote_set.*", {
				object_id: set.id,
			});
		}

		// begin subscriptions to personal events in the channel
		const cond = {
			ctx: "channel",
			platform: "TWITCH",
			id: channel.id,
		};

		this.driver.eventAPI.subscribe("entitlement.*", cond);
		this.driver.eventAPI.subscribe("cosmetic.*", cond);
		this.driver.eventAPI.subscribe("emote_set.*", cond);
	}

	public API() {
		return {
			seventv,
			frankerfacez,
			betterttv,
		};
	}
}

export const seventv = {
	async loadUserEmoteSet(platform: Platform, id: string): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.SEVENTV, `users/${platform.toLowerCase()}/${id}`).catch((err) =>
			Promise.reject(err),
		);
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const data = (await resp.json()) as SevenTV.UserConnection;

		const set = structuredClone(data.emote_set) as SevenTV.EmoteSet;
		set.emotes = set.emotes ?? [];
		set.provider = "7TV";
		set.priority = ProviderPriority.SEVENTV;

		data.emote_set = null;

		return Promise.resolve(set);
	},

	async loadGlobalSet(): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.SEVENTV, "emote-sets/global").catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const set = (await resp.json()) as SevenTV.EmoteSet;

		set.emotes = set.emotes ?? [];
		set.provider = "7TV/G" as SevenTV.Provider;

		db.emoteSets.put(set).catch(() => db.emoteSets.where({ id: set.id, provider: "7TV" }).modify(set));
		return Promise.resolve(set);
	},

	async loadUserData(platform: Platform, id: string): Promise<SevenTV.User> {
		const resp = await doRequest(API_BASE.SEVENTV, `users/${platform.toLowerCase()}/${id}`).catch((err) =>
			Promise.reject(err),
		);
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const userConn = (await resp.json()) as SevenTV.UserConnection;
		if (!userConn.user) return Promise.reject(new Error("No user was returned!"));

		return Promise.resolve(userConn.user);
	},

	async writePresence(platform: Platform, userID: string, channelID: string): Promise<void> {
		doRequest(API_BASE.SEVENTV, `users/${userID}/presences`, "POST", {
			kind: 1,
			data: {
				platform,
				id: channelID,
			},
		}).then(() => log.info("<Net/Http> Presence sent"));
	},
};

export const frankerfacez = {
	async loadUserEmoteSet(channelID: string): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.FFZ, `room/id/${channelID}`).catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const ffz_data = (await resp.json()) as FFZ.RoomResponse;

		const set = convertFFZEmoteSet(ffz_data, channelID);
		set.priority = ProviderPriority.FFZ;

		return Promise.resolve(set);
	},

	async loadGlobalEmoteSet(): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.FFZ, "set/global").catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const ffz_data = (await resp.json()) as FFZ.RoomResponse;

		const set = convertFFZEmoteSet({ sets: { emoticons: ffz_data.sets["3"] } }, "GLOBAL");
		set.provider = "FFZ/G" as SevenTV.Provider;

		db.emoteSets.put(set).catch(() => {
			db.emoteSets.where({ id: set.id, provider: "FFZ" }).modify(set);
		});

		return Promise.resolve(set);
	},
};

export const betterttv = {
	async loadUserEmoteSet(channelID: string): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.BTTV, `cached/users/twitch/${channelID}`).catch((err) =>
			Promise.reject(err),
		);
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const bttv_data = (await resp.json()) as BTTV.UserResponse;

		const set = convertBttvEmoteSet(bttv_data, channelID);
		set.priority = ProviderPriority.BTTV;

		return Promise.resolve(set);
	},

	async loadGlobalEmoteSet(): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.BTTV, "cached/emotes/global").catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const bttv_data = (await resp.json()) as BTTV.Emote[];

		const data = {
			channelEmotes: bttv_data,
			sharedEmotes: [] as BTTV.Emote[],
			id: "GLOBAL",
			avatar: "",
		} as BTTV.UserResponse;

		const set = convertBttvEmoteSet(data, data.id);
		set.provider = "BTTV/G" as SevenTV.Provider;

		db.emoteSets.put(set).catch(() => {
			db.emoteSets.where({ id: set.id, provider: "BTTV" }).modify(set);
		});

		return Promise.resolve(set);
	},
};

async function doRequest<T = object>(base: string, path: string, method?: string, body?: T): Promise<Response> {
	return fetch(`${base}/${path}`, {
		method,
		body: body ? JSON.stringify(body) : undefined,
		headers: {
			"Content-Type": "application/json",
		},
	}).then(async (resp) => {
		const loggable = resp.clone();

		log.debugWithObjects(
			["<API>", `${resp.status} ${resp.statusText}${method ?? "GET"} ${base}/${path}`],
			[await loggable.json()],
		);

		return resp;
	});
}
