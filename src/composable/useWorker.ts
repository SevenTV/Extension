import { LOCAL_STORAGE_KEYS } from "@/common/Constant";
import { TypedEventListenerOrEventListenerObject } from "@/common/EventTarget";
import { Logger, log } from "@/common/Logger";
import { TypedWorkerMessage, WorkerMessage, WorkerMessageType } from "@/worker";

const workerLog = new Logger();
workerLog.setContextName("Worker/Pipe");

let worker: SharedWorker | null = null;

export function useWorker() {
	async function init(bc: BroadcastChannel): Promise<SharedWorker> {
		let sw: SharedWorker;

		// Check for existing url
		// If it exists, we'll connect to it
		let workerURL: string | null = localStorage.getItem(LOCAL_STORAGE_KEYS.WORKER_ADDR);
		const ok =
			workerURL &&
			(await fetch(workerURL)
				.then((res) => res.ok)
				.catch(() => false));

		// Fetch worker data
		if (!ok) {
			// Get the offline URL passed by the loader
			workerURL = document.querySelector("script#seventv")?.getAttribute("worker_url") ?? null;
			if (!workerURL) {
				log.error("Unable to find address to worker");
			}

			// Fetch worker data
			const data = await (await fetch(workerURL || "")).blob().catch((err) => {
				log.error("Unable to fetch worker data", err);
			});
			if (!data) return Promise.reject("There was an error fetching worker data");

			log.info("Received worker data", `(${data.size} bytes)`);

			// Create BLOB URL for worker & set it into local storage
			workerURL = URL.createObjectURL(data);
			localStorage.setItem(LOCAL_STORAGE_KEYS.WORKER_ADDR, workerURL);
		} else {
			log.info("Connecting to existing worker", `addr=${workerURL}`);
		}

		// Connect to worker
		return new Promise<SharedWorker>((resolve, reject) => {
			if (!workerURL) return reject("No address to worker");

			// Define message handlers
			useGlobalHandlers(bc);

			// Spawn or connect to worker
			sw = worker = new SharedWorker(workerURL, {
				name: "seventv-extension",
			});
			sw.port.start();

			useHandlers(sw.port);

			// Emit close on page exit
			addEventListener("beforeunload", () => {
				sendMessage("CLOSE", {});
			});

			resolve(sw);
		});
	}

	function sendMessage<T extends WorkerMessageType>(type: T, data: TypedWorkerMessage<T>): void {
		if (!worker) return;

		worker.port.postMessage({
			type: type,
			data: data,
		});
	}

	return {
		init,
		sendMessage,
		target: events,
	};
}

function useGlobalHandlers(bc: BroadcastChannel) {
	bc.onmessage = (ev) => {
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
	};
}

function useHandlers(mp: MessagePort) {
	mp.addEventListener("message", (ev) => {
		const { type, data } = ev.data as WorkerMessage<WorkerMessageType>;

		switch (type) {
			case "INIT": {
				events.emit("ready", {});
				break;
			}
			case "CHANNEL_FETCHED": {
				const { channel } = data as TypedWorkerMessage<"CHANNEL_FETCHED">;

				events.emit("channel_fetched", channel);
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
			}
		}
	});
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
}

type WorkletEventName =
	| "ready"
	| "channel_fetched"
	| "entitlement_created"
	| "entitlement_deleted"
	| "static_cosmetics_fetched";

type WorkletTypedEvent<EVN extends WorkletEventName> = {
	ready: object;
	channel_fetched: CurrentChannel;
	entitlement_created: Pick<SevenTV.Entitlement, "id" | "kind" | "ref_id" | "user_id">;
	entitlement_deleted: Pick<SevenTV.Entitlement, "id" | "kind" | "ref_id" | "user_id">;
	static_cosmetics_fetched: Pick<TypedWorkerMessage<"STATIC_COSMETICS_FETCHED">, "badges" | "paints">;
}[EVN];

export class WorkletEvent<T extends WorkletEventName> extends CustomEvent<WorkletTypedEvent<T>> {
	constructor(type: T, data: WorkletTypedEvent<T>) {
		super(type, { detail: data });
	}
}

const events = new WorkletTarget();
