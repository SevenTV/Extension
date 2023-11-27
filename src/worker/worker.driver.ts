import type { TypedEventListenerOrEventListenerObject } from "@/common/EventTarget";
import { Logger, log } from "@/common/Logger";
import { getRandomInt } from "@/common/Rand";
import { Dexie7, db } from "@/db/idb";
import { EventAPI } from "./worker.events";
import { WorkerHttp } from "./worker.http";
import { WorkerPort } from "./worker.port";

export class WorkerDriver extends EventTarget {
	http: WorkerHttp;
	eventAPI: EventAPI;
	db: Dexie7;
	log: Logger;

	ports = new Map<symbol, WorkerPort>();
	portSeq = 0;

	cache: Cache | null = null;

	constructor(public w: SharedWorkerGlobalScope) {
		super();

		this.db = db;
		this.log = log;
		this.log.setContextName("Worker");
		this.log.pipe = (type, text, extraCSS, objects) => {
			for (const port of this.ports.values()) {
				port.postMessage("LOG", {
					type,
					text,
					css: extraCSS,
					objects: objects ?? [],
				});
			}
		};

		this.http = new WorkerHttp(this);
		this.eventAPI = new EventAPI(this);

		db.ready().then(async () => {
			// Fetch global emotes & cosmetics
			const sets = [] as SevenTV.EmoteSet[];
			let emoteCount = 0;

			Promise.allSettled<SevenTV.EmoteSet>([
				// Global Emotes
				this.http.API().seventv.loadEmoteSet("global"),
				this.http.API().frankerfacez.loadGlobalEmoteSet(),
				this.http.API().betterttv.loadGlobalEmoteSet(),
			])
				.then(async (results) => {
					results.forEach((r) => {
						if (!(r.status === "fulfilled" && r.value)) return;

						sets.push(r.value);
						emoteCount += r.value.emotes.length;
					});

					// Delete stale global set(s)
					db.emoteSets
						.where("scope")
						.equals("GLOBAL")
						.and((es) => !sets.map((x) => x.id).includes(es.id))
						.delete()
						.catch((err) => log.error("failed to delete stale global emote set:", err));

					log.info(
						"<API>",
						`Global Emotes (${emoteCount}):`,
						`${sets.map((s) => `${s.provider}=${s.emotes.length}`).join(", ")}`,
					);
				})
				.catch((e) => log.error("<API>", "Failed to fetch global emotes:", e));
		});

		// Track new connections
		w.onconnect = (ev) => {
			const port = ev.ports[0];
			if (port) {
				const p = new WorkerPort(this, port);
				this.ports.set(p.id, p);

				// Do DB cleanup for unused data
				setTimeout(
					() => {
						const exemptions = Array.from(this.ports.values())
							.filter((p) => p.channels.size)
							.flatMap((p) => p.channelIds);

						db.expireDocuments(exemptions);
					},
					getRandomInt(2500, 15000),
				);

				// Fetch config anew
				this.http
					.fetchConfig()
					.then((cfg) => {
						setTimeout(() => {
							p.postMessage("CONFIG", cfg); // send config data to port
						}, 3000); // TODO: Improve this, it should just be based on events from the page
					})
					.catch((e) => log.error("<API>", "Failed to fetch config:", e.status));
			}
		};

		w.caches.open("SEVENTV#CACHE").then((c) => (this.cache = c));

		this.log.info("Worker has spawned. Logs will be piped to the UI thread");
	}

	addEventListener<T extends WorkerEventName>(
		type: T,
		callback: TypedEventListenerOrEventListenerObject<WorkerEvent<T>> | null,
		options?: boolean | AddEventListenerOptions | undefined,
	): void {
		return super.addEventListener(type, callback as EventListenerOrEventListenerObject, options);
	}

	removeEventListener<T extends WorkerEventName>(
		type: T,
		callback: TypedEventListenerOrEventListenerObject<WorkerEvent<T>> | null,
		options?: boolean | EventListenerOptions | undefined,
	): void {
		return super.removeEventListener(type, callback as EventListenerOrEventListenerObject, options);
	}

	dispatchEvent<T extends WorkerEventName>(event: WorkerEvent<T>): boolean {
		return super.dispatchEvent(event);
	}

	emit<T extends WorkerEventName>(type: T, data: WorkerTypedEvent<T>, port?: WorkerPort): void {
		this.dispatchEvent(new WorkerEvent(type, data, port));
	}
}

type WorkerEventName =
	| "open"
	| "close"
	| "idb_ready"
	| "join_channel"
	| "part_channel"
	| "set_channel_presence"
	| "identity_updated"
	| "user_updated"
	| "imageformat_updated";

type WorkerTypedEvent<EVN extends WorkerEventName> = {
	open: void;
	close: void;
	idb_ready: void;
	join_channel: CurrentChannel;
	part_channel: CurrentChannel;
	set_channel_presence: CurrentChannel;
	channel_data_fetched: CurrentChannel;
	identity_updated: TwitchIdentity | YouTubeIdentity;
	user_updated: SevenTV.User;
	imageformat_updated: string;
}[EVN];

export class WorkerEvent<T extends WorkerEventName> extends CustomEvent<WorkerTypedEvent<T>> {
	constructor(
		type: T,
		data: WorkerTypedEvent<T>,
		public port?: WorkerPort,
	) {
		super(type, { detail: data });
	}
}
