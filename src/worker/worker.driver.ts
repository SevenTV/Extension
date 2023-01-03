import type { TypedEventListenerOrEventListenerObject } from "@/common/EventTarget";
import { Logger, log } from "@/common/Logger";
import { getRandomInt } from "@/common/Rand";
import { EventAPI } from "./worker.events";
import { WorkerHttp } from "./worker.http";
import { WorkerPort } from "./worker.port";
import { Dexie7, db } from "@/db/idb";
import { TypedWorkerMessage, WorkerMessageType } from ".";

export class WorkerDriver extends EventTarget {
	bc: BroadcastChannel;
	http: WorkerHttp;
	eventAPI: EventAPI;
	db: Dexie7;
	log: Logger;

	ports = new Map<symbol, WorkerPort>();

	constructor(public w: SharedWorkerGlobalScope) {
		super();

		this.bc = new BroadcastChannel("SEVENTV#NETWORK");
		this.db = db;
		this.log = log;
		this.log.setContextName("Worker");
		this.log.pipe = (type, text, extraCSS, objects) => {
			this.bc.postMessage({
				type: "LOG",
				data: {
					type,
					text,
					css: extraCSS,
					objects,
				},
			});
		};

		this.http = new WorkerHttp(this);
		this.eventAPI = new EventAPI(this);
		this.eventAPI.connect("WebSocket");

		db.ready().then(async () => {
			// Fetch global emotes
			const sets = [] as SevenTV.EmoteSet[];
			let emoteCount = 0;

			await Promise.allSettled<SevenTV.EmoteSet>([
				this.http.API().seventv.loadGlobalSet(),
				this.http.API().frankerfacez.loadGlobalEmoteSet(),
				this.http.API().betterttv.loadGlobalEmoteSet(),
			])
				.then((results) => {
					results.forEach((r) => {
						if (!(r.status === "fulfilled" && r.value)) return;

						sets.push(r.value);
						emoteCount += r.value.emotes.length;
					});

					log.info(
						"<API>",
						`Global Emotes (${emoteCount}):`,
						`${sets.map((s) => `${s.provider}=${s.emotes.length}`).join(", ")}`,
					);
				})
				.catch((e) => log.error("<API>", "Failed to fetch global emotes:", e));

			// Do DB cleanup for unused data
			setTimeout(() => {
				const exemptions = Array.from(this.ports.values())
					.filter((p) => p.channel)
					.map((p) => p.channel!.id);

				db.expireDocuments(exemptions);
			}, getRandomInt(2500, 15000));
		});

		// Track new connections
		w.onconnect = (ev) => {
			const port = ev.ports[0];
			if (port) {
				const p = new WorkerPort(this, port);
				this.ports.set(p.id, p);
			}
		};

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

	public broadcastMessage<T extends WorkerMessageType>(type: T, data: TypedWorkerMessage<T>): void {
		this.bc.postMessage({
			type: type,
			data: data,
		});
	}
}

type WorkerEventName =
	| "open"
	| "close"
	| "idb_ready"
	| "start_watching_channel"
	| "stop_watching_channel"
	| "set_channel_presence"
	| "identity_updated"
	| "user_updated";

type WorkerTypedEvent<EVN extends WorkerEventName> = {
	open: void;
	close: void;
	idb_ready: void;
	start_watching_channel: CurrentChannel;
	stop_watching_channel: CurrentChannel;
	set_channel_presence: object;
	channel_data_fetched: CurrentChannel;
	identity_updated: TwitchIdentity | YouTubeIdentity;
	user_updated: SevenTV.User;
}[EVN];

export class WorkerEvent<T extends WorkerEventName> extends CustomEvent<WorkerTypedEvent<T>> {
	constructor(type: T, data: WorkerTypedEvent<T>, public port?: WorkerPort) {
		super(type, { detail: data });
	}
}
