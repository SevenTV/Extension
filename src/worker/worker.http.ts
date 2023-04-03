// REST Helpers
// Fetches initial data from API
import { BitField, EmoteSetFlags } from "@/common/Flags";
import { imageHostToSrcset } from "@/common/Image";
import { log } from "@/common/Logger";
import {
	convertBttvEmoteSet,
	convertFFZEmoteSet,
	convertFfzBadges,
	convertSeventvOldCosmetics,
} from "@/common/Transform";
import { db } from "@/db/idb";
import type { WorkerDriver } from "./worker.driver";
import type { WorkerPort } from "./worker.port";

namespace API_BASE {
	export const SEVENTV = import.meta.env.VITE_APP_API;
	export const SEVENTV_OLD = import.meta.env.VITE_APP_API_REST_OLD;
	export const FFZ = "https://api.frankerfacez.com/v1";
	export const BTTV = "https://api.betterttv.net/3";
}

enum ProviderPriority {
	BTTV_GLOBAL,
	FFZ_GLOBAL,
	SEVENTV_GLOBAL,
	BTTV,
	FFZ,
	SEVENTV,
	TWITCH,
}

export class WorkerHttp {
	private lastPresenceAt = 0;
	static imageFormat: SevenTV.ImageFormat = "WEBP";

	constructor(private driver: WorkerDriver) {
		this.driver = driver;

		driver.addEventListener("start_watching_channel", (ev) =>
			ev.port ? this.fetchChannelData(ev.detail, ev.port) : undefined,
		);
		driver.addEventListener("identity_updated", async (ev) => {
			const user = await this.API().seventv.loadUserData(ev.port?.platform ?? "TWITCH", ev.detail.id);
			if (user && ev.port) {
				ev.port.user = user;
			}
		});
		driver.addEventListener("set_channel_presence", (ev) => {
			if (!ev.port || !ev.port.platform || !ev.port.user || !ev.port.channel) return;
			if (this.lastPresenceAt && this.lastPresenceAt > Date.now() - 1000) {
				return;
			}

			this.lastPresenceAt = Date.now();
			this.writePresence(ev.port.platform, ev.port.user.id, ev.port.channel.id);
		});
		driver.addEventListener("imageformat_updated", async (ev) => {
			if (!ev.port) return;
			WorkerHttp.imageFormat = ev.port.imageFormat!;
		});
	}

	public async fetchConfig(): Promise<SevenTV.Config> {
		const configName =
			"extension" +
			(import.meta.env.VITE_APP_VERSION_BRANCH ? `-${import.meta.env.VITE_APP_VERSION_BRANCH}` : "");
		const resp = await doRequest<SevenTV.Config>(API_BASE.SEVENTV, `config/${configName}`, "GET").catch((err) =>
			Promise.reject(err),
		);
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const data = await resp.json();
		return Promise.resolve(data);
	}

	public async fetchChannelData(channel: CurrentChannel, port: WorkerPort) {
		await this.driver.db.ready();

		this.driver.log.debug(`<Net/Http> fetching channel data for #${channel.username}`);

		// store the channel into IDB
		await db.withErrorFallback(
			db.channels.put({
				id: channel.id,
				platform: port.platform as Platform,
				set_ids: [],
			}),
			() => db.channels.where("id").equals(channel.id).modify(channel),
		);

		// setup fetching promises
		const user = seventv.loadUserConnection(port.platform ?? "TWITCH", channel.id).catch(() => void 0);

		const promises = [
			["7TV", user.then((es) => (es ? es.emote_set : null)).catch(() => void 0)],
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

		channel.user = (await user)?.user ?? undefined;
		if (port) {
			// Post channel fetch notification back to port
			port.postMessage("CHANNEL_FETCHED", {
				channel,
			});
		}

		// begin subscriptions to channel emote sets
		for (const set of sets) {
			if (set.provider !== "7TV") continue; // we only care about 7TV sets, as others have no events

			this.driver.eventAPI.subscribe(
				"emote_set.*",
				{
					object_id: set.id,
				},
				port,
			);
			if (set.owner) this.driver.eventAPI.subscribe("user.*", { object_id: set.owner.id }, port);
		}

		// begin subscriptions to personal events in the channel
		const cond = {
			ctx: "channel",
			platform: "TWITCH",
			id: channel.id,
		};

		this.driver.eventAPI.subscribe("entitlement.*", cond, port);
		this.driver.eventAPI.subscribe("cosmetic.*", cond, port);
		this.driver.eventAPI.subscribe("emote_set.*", cond, port);

		// Send an initial presence so that the current user immediately has their cosmetics
		// (sent with "self" property, so that the presence and entitlements are not published)
		if (port.platform && port.user && port.channel) {
			this.writePresence(port.platform, port.user.id, port.channel.id, true);
		}

		// Send the legacy static cosmetics to the port
		Promise.all([
			await this.API()
				.seventv.loadOldCosmetics("twitch_id", this.driver.cache)
				.catch((err) => log.error("Failed to load old cosmetics", err)),
			port.providerExtensions.has("FFZ") // load ffz badges if their extension is installed
				? await this.API()
						.frankerfacez.loadCosmetics()
						.catch(() => void 0)
				: void 0,
		]).then(([seventv, ffz]) => {
			const converted = seventv ? convertSeventvOldCosmetics(seventv) : [];
			const badges = [...(seventv ? converted[0] : []), ...(ffz ? convertFfzBadges(ffz) : [])];
			const paints = converted[1] ?? [];

			port.postMessage("STATIC_COSMETICS_FETCHED", {
				badges,
				paints,
			});

			log.info(`<Static Cosmetics> ${badges.length} badges, ${paints.length} paints`);
		});
	}

	/**
	 * Emit a presence update to 7TV for the given user & channel location
	 *
	 * This will make the EventAPI send the user's entitlements to other users in the channel
	 * @param self if true, the entitlements will only be sent to the current user
	 */
	async writePresence(platform: Platform, userID: string, channelID: string, self?: boolean): Promise<void> {
		doRequest(API_BASE.SEVENTV, `users/${userID}/presences`, "POST", {
			kind: 1,
			passive: self,
			session_id: self ? this.driver.eventAPI.sessionID : undefined,
			data: {
				platform,
				id: channelID,
			},
		}).then(() => log.debug("<API> Presence sent"));
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
	async loadUserConnection(platform: Platform, id: string): Promise<SevenTV.UserConnection> {
		const resp = await doRequest(API_BASE.SEVENTV, `users/${platform.toLowerCase()}/${id}`).catch((err) =>
			Promise.reject(err),
		);
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const data = (await resp.json()) as SevenTV.UserConnection;

		const set = structuredClone(data.emote_set) as SevenTV.EmoteSet;

		set.provider = "7TV";
		set.scope = "CHANNEL";
		set.priority = ProviderPriority.SEVENTV;

		set.emotes.map((ae) => {
			ae.provider = set.provider;
			ae.scope = "CHANNEL";

			if (ae.data) ae.data.host.srcset = imageHostToSrcset(ae.data.host, "7TV", WorkerHttp.imageFormat, 2);
			return ae;
		});

		data.emote_set = set;

		return Promise.resolve(data);
	},

	async loadEmoteSet(id: string): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.SEVENTV, `emote-sets/${id}`).catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const set = (await resp.json()) as SevenTV.EmoteSet;

		set.provider = "7TV";
		if (id === "global") set.scope = "GLOBAL";
		else if (BitField(EmoteSetFlags, set.flags ?? 0).has("Personal")) set.scope = "PERSONAL";
		else set.scope = "CHANNEL";
		set.priority = ProviderPriority.SEVENTV_GLOBAL;

		set.emotes.map((ae) => {
			ae.provider = set.provider;
			ae.scope = set.scope;
			if (ae.data) ae.data.host.srcset = imageHostToSrcset(ae.data.host, "7TV", WorkerHttp.imageFormat, 2);

			return ae;
		});

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

	async loadOldCosmetics(
		identifier: "twitch_id" | "login" | "object_id",
		cache?: Cache | null,
	): Promise<SevenTV.OldCosmeticsResponse> {
		if (cache) {
			const cached = await cache.match(API_BASE.SEVENTV_OLD + `/cosmetics?user_identifier=${identifier}`);
			if (cached) {
				log.debug("<API/Old> Old Cosmetics cache hit");
				return Promise.resolve<SevenTV.OldCosmeticsResponse>(await cached.json());
			}
		}

		const resp = await doRequest(API_BASE.SEVENTV_OLD, `cosmetics?user_identifier=${identifier}`).catch((err) =>
			Promise.reject(err),
		);
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		if (cache) {
			cache.add(resp.url);
		}

		return Promise.resolve<SevenTV.OldCosmeticsResponse>(await resp.json());
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

		set.scope = "CHANNEL";
		set.priority = ProviderPriority.FFZ;

		set.emotes.forEach((e) => {
			e.scope = "CHANNEL";
		});

		return Promise.resolve(set);
	},

	async loadGlobalEmoteSet(): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.FFZ, "set/global").catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const ffz_data = (await resp.json()) as FFZ.RoomResponse;

		const set = convertFFZEmoteSet({ sets: { emoticons: ffz_data.sets["3"] } }, "GLOBAL");

		set.scope = "GLOBAL";
		set.priority = ProviderPriority.FFZ_GLOBAL;

		set.emotes.forEach((e) => {
			e.scope = "GLOBAL";
		});

		db.emoteSets.put(set).catch(() => {
			db.emoteSets.where({ id: set.id, provider: "FFZ" }).modify(set);
		});

		return Promise.resolve(set);
	},
	async loadCosmetics(): Promise<FFZ.BadgesResponse> {
		const resp = await doRequest(API_BASE.FFZ, "badges/ids");
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		return Promise.resolve(structuredClone(await resp.json()));
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

		set.scope = "CHANNEL";
		set.priority = ProviderPriority.BTTV;

		set.emotes.forEach((e) => {
			e.scope = "CHANNEL";
		});

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
		set.scope = "GLOBAL";
		set.priority = ProviderPriority.BTTV_GLOBAL;

		set.emotes.forEach((e) => {
			e.scope = "GLOBAL";
		});

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
		referrer: location.origin,
		referrerPolicy: "origin",
	}).then(async (resp) => {
		const loggable = resp.clone();

		log.debugWithObjects(
			["<API>", `${resp.status} ${resp.statusText}${method ?? "GET"} ${base}/${path}`],
			[await loggable.json()],
		);

		return resp;
	});
}
