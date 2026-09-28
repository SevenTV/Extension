import { TypedEventListenerOrEventListenerObject } from "@/common/EventTarget";
import { Logger, log } from "@/common/Logger";
import { TypedWorkerMessage, WorkerMessage, WorkerMessageType } from "@/worker";

let workerURL: string | null;

const workerLog = new Logger();
workerLog.setContextName("Worker/Pipe");

let worker: SharedWorker | null = null;

async function init(originURL: string): Promise<SharedWorker> {
	let sw: SharedWorker;
	markSafariPerformance("worker-init-start");

	// The worker must always come from the packaged extension. Previously this
	// accepted a URL cached in Twitch localStorage, which is controlled by the
	// host page and could make 7TV execute an attacker-selected worker.
	if (import.meta.env.VITE_APP_SAFARI === "true" && !isPackagedWorkerURL(originURL)) {
		return Promise.reject("Refusing to load a worker outside the extension package");
	}

	const data = await fetch(originURL)
		.then((r) => {
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
			return r.blob();
		})
		.catch((err) => {
			log.error("Unable to fetch packaged worker data", err);
		});
	if (!data) return Promise.reject("There was an error fetching packaged worker data");

	log.info("Received packaged worker data", `(${data.size} bytes)`);
	markSafariPerformance("worker-script-ready");
	workerURL = URL.createObjectURL(data);

	// Connect to worker
	return new Promise<SharedWorker>((resolve, reject) => {
		if (!workerURL) return reject("No address to worker");

		// Spawn or connect to worker
		sw = worker = new SharedWorker(workerURL, {
			name: "seventv-extension",
		});
		sw.port.start();

		// Define message handlers
		useGlobalHandlers(sw.port);
		useHandlers(sw.port);

		// Emit close on page exit
		addEventListener("beforeunload", () => {
			sendMessage("CLOSE", {});
		});

		resolve(sw);
	});
}

function isPackagedWorkerURL(value: string): boolean {
	try {
		const url = new URL(value);
		return (
			(url.protocol === "safari-web-extension:" || url.protocol === "chrome-extension:") &&
			url.pathname === "/worker.js" &&
			url.search === "" &&
			url.hash === ""
		);
	} catch {
		return false;
	}
}

function sendMessage<T extends WorkerMessageType>(type: T, data: TypedWorkerMessage<T>): void {
	if (!worker) return;

	worker.port.postMessage({
		type: type,
		data: data,
	});
}

export function useWorker() {
	return {
		init,
		sendMessage,
		target: events,
	};
}

function useGlobalHandlers(chan: MessagePort) {
	chan.addEventListener("message", (ev) => {
		const { type, data } = ev.data;

		switch (type) {
			case "LOG": {
				const { type, text, css, objects } = data as TypedWorkerMessage<"LOG">;
				(text as string[]).splice(1, 0, "%c[Worker]%c");
				(css as string[]).splice(1, 0, ...Array(2).fill("color: #ca32fc;font-weight:900"));

				workerLog["print"](type, text, css, objects);
				break;
			}
		}
	});
}

function useHandlers(mp: MessagePort) {
	mp.addEventListener("message", (ev) => {
		const { type, data } = ev.data as WorkerMessage<WorkerMessageType>;

		switch (type) {
			case "INIT": {
				markSafariPerformance("worker-ready");
				events.emit("ready", {});
				break;
			}
			case "CONFIG": {
				events.emit("config", data as TypedWorkerMessage<"CONFIG">);

				break;
			}
			case "IDENTITY_FETCHED": {
				const { user } = data as TypedWorkerMessage<"IDENTITY_FETCHED">;

				events.emit("identity_fetched", { user });
				break;
			}
			case "CHANNEL_FETCHED": {
				const { channel } = data as TypedWorkerMessage<"CHANNEL_FETCHED">;
				markSafariPerformance(`channel-${channel.id}-metadata-ready`);

				events.emit("channel_fetched", channel);
				break;
			}
			case "PROVIDER_SET_FETCHED": {
				const result = data as TypedWorkerMessage<"PROVIDER_SET_FETCHED">;
				markSafariPerformance(`channel-${result.channel.id}-${result.provider.toLowerCase()}-set-ready`);
				break;
			}
			case "CHANNEL_SETS_FETCHED": {
				const { channel } = data as TypedWorkerMessage<"CHANNEL_SETS_FETCHED">;
				markSafariPerformance(`channel-${channel.id}-all-sets-settled`);

				events.emit("channel_sets_fetched", channel);
				break;
			}
			case "COSMETIC_CREATED": {
				const cosmetic = data as TypedWorkerMessage<"COSMETIC_CREATED">;

				events.emit("cosmetic_created", cosmetic);
				break;
			}
			case "ENTITLEMENT_CREATED": {
				const entitlement = data as TypedWorkerMessage<"ENTITLEMENT_CREATED">;

				events.emit("entitlement_created", entitlement);
				break;
			}
			case "ENTITLEMENT_DELETED": {
				const entitlement = data as TypedWorkerMessage<"ENTITLEMENT_DELETED">;

				events.emit("entitlement_deleted", entitlement);
				break;
			}
			case "STATIC_COSMETICS_FETCHED": {
				const { badges, paints } = data as TypedWorkerMessage<"STATIC_COSMETICS_FETCHED">;

				events.emit("static_cosmetics_fetched", { badges, paints });
				break;
			}
			case "SYNC_TWITCH_SET": {
				const { out } = data as TypedWorkerMessage<"SYNC_TWITCH_SET">;
				if (!out) return;

				events.emit("twitch_emote_set_data", out);
				break;
			}
			case "EMOTE_SET_UPDATED":
				events.emit("emote_set_updated", data as TypedWorkerMessage<"EMOTE_SET_UPDATED">);
				break;
			case "USER_UPDATED":
				events.emit("user_updated", data as TypedWorkerMessage<"USER_UPDATED">);
				break;
		}
	});
}

function markSafariPerformance(name: string): void {
	if (import.meta.env.VITE_APP_SAFARI !== "true" || typeof performance?.mark !== "function") return;

	performance.mark(`seventv:${name}`);
}

class WorkletTarget extends EventTarget {
	constructor() {
		super();
	}

	addEventListener<T extends WorkletEventName>(
		type: T,
		listener: TypedEventListenerOrEventListenerObject<WorkletEvent<T>> | null,
		options?: boolean | AddEventListenerOptions,
	): void {
		super.addEventListener(type, listener as EventListenerOrEventListenerObject, options);
	}

	removeEventListener<T extends WorkletEventName>(
		type: T,
		listener: TypedEventListenerOrEventListenerObject<WorkletEvent<T>> | null,
		options?: boolean | EventListenerOptions,
	): void {
		super.removeEventListener(type, listener as EventListenerOrEventListenerObject, options);
	}

	dispatchEvent<T extends WorkletEventName>(event: WorkletEvent<T>): boolean {
		return super.dispatchEvent(event);
	}

	emit<T extends WorkletEventName>(type: T, data: WorkletTypedEvent<T>) {
		this.dispatchEvent(new CustomEvent(type, { detail: data }));
	}

	/**
	 * Listen until callback returns true
	 *
	 * @param name event name
	 * @param cb event callback
	 **/
	async listenUntil<T extends WorkletEventName>(name: T, cb: (ev: WorkletEvent<T>) => boolean) {
		await new Promise<void>((resolve) => {
			this.addEventListener(name, (ev) => {
				if (!cb(ev)) return;
				this.removeEventListener(name, cb);
				resolve();
			});
		});
	}
}

export type WorkletEventName =
	| "ready"
	| "config"
	| "identity_fetched"
	| "channel_fetched"
	| "channel_sets_fetched"
	| "cosmetic_created"
	| "entitlement_created"
	| "entitlement_deleted"
	| "static_cosmetics_fetched"
	| "twitch_emote_set_data"
	| "emote_set_updated"
	| "user_updated";

type WorkletTypedEvent<EVN extends WorkletEventName> = {
	ready: object;
	config: TypedWorkerMessage<"CONFIG">;
	identity_fetched: TypedWorkerMessage<"IDENTITY_FETCHED">;
	channel_fetched: CurrentChannel;
	channel_sets_fetched: CurrentChannel;
	cosmetic_created: Pick<SevenTV.Cosmetic, "id" | "data" | "kind">;
	entitlement_created: Pick<SevenTV.Entitlement, "id" | "kind" | "ref_id" | "user_id" | "platform_id">;
	entitlement_deleted: Pick<SevenTV.Entitlement, "id" | "kind" | "ref_id" | "user_id" | "platform_id">;
	static_cosmetics_fetched: Pick<TypedWorkerMessage<"STATIC_COSMETICS_FETCHED">, "badges" | "paints">;
	twitch_emote_set_data: SevenTV.EmoteSet;
	emote_set_updated: TypedWorkerMessage<"EMOTE_SET_UPDATED">;
	user_updated: TypedWorkerMessage<"USER_UPDATED">;
}[EVN];

export class WorkletEvent<T extends WorkletEventName> extends CustomEvent<WorkletTypedEvent<T>> {
	constructor(type: T, data: WorkletTypedEvent<T>) {
		super(type, { detail: data });
	}
}

const events = new WorkletTarget();
