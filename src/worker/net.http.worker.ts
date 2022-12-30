// REST Helpers
// Fetches initial data from API

import { log } from "@/common/Logger";
import { convertBttvEmoteSet, convertFFZEmoteSet } from "@/common/Transform";
import { db } from "@/db/IndexedDB";
import { ws } from "./net.events.worker";

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

export async function onChannelChange(channel: CurrentChannel) {
	// store the channel into IDB
	db.channels.put({ id: channel.id, set_ids: [] }, channel.id).catch(() => {
		db.channels.where("id").equals(channel.id).modify(channel);
	});

	// setup fetching promises
	const promises = [
		["7TV", seventv.loadUserEmoteSet("TWITCH", channel.id)],
		["FFZ", frankerfacez.loadUserEmoteSet(channel.id)],
		["BTTV", betterttv.loadUserEmoteSet(channel.id)],
	] as [string, Promise<SevenTV.EmoteSet>][];

	const onResult = (set: SevenTV.EmoteSet) => {
		if (!set) return;

		// store set to DB
		db.emoteSets.put(set).catch(() => {
			db.emoteSets.where({ id: set.id, provider: set.provider }).modify(set);
		});

		// add set ID to the channel
		db.channels
			.where("id")
			.equals(channel.id)
			.modify((x) => x.set_ids.push(set.id));
	};

	// iterate results and store sets to DB
	for (const [provider, setP] of promises) {
		setP.then((set) => onResult(set)).catch((err) =>
			log.error(`<Net/Http> failed to load emote set from provider ${provider} in #${channel.username}`, err),
		);
	}

	// listen to events (scuffed)
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

		if (data.user) {
			db.users
				.where("id")
				.equals(data.id)
				.modify(data.user)
				.catch(() => {
					db.users
						.add(data.user as SevenTV.User)
						.catch((err) => log.error("<Net/Http>", "failed to add user to database", err));
				});
		}

		ws.subscribe("emote_set.*", { object_id: set.id });

		return Promise.resolve(set);
	},

	async loadGlobalSet(): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.SEVENTV, "emote-sets/global").catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const set = (await resp.json()) as SevenTV.EmoteSet;

		set.provider = "7TV/G" as SevenTV.Provider;

		db.emoteSets.put(set).catch(() => db.emoteSets.where({ id: set.id, provider: "7TV" }).modify(set));
		return Promise.resolve(set);
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

function doRequest(base: string, path: string): Promise<Response> {
	return fetch(`${base}/${path}`, {});
}
