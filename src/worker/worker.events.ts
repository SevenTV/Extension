// EventAPI - WebSocket
// Keeps our data state up to date
import { log } from "@/common/Logger";
import { getRandomInt } from "@/common/Rand";
import { handleDispatchedEvent } from "./event-handlers/handler";
import type { WorkerDriver } from "./worker.driver";
import { WorkerPort } from "./worker.port";
import { EventAPIMessage, EventAPIOpCode, EventContext, SubscriptionData } from ".";

export class EventAPI {
	private transport: EventAPITransport = "WebSocket";
	private heartbeatInterval: number | null = null;
	private backoff = 100;

	sessionID = "";
	subscriptions: Record<string, SubscriptionRecord[]> = {};

	url = import.meta.env.VITE_APP_API_EVENTS;
	branch = import.meta.env.VITE_APP_VERSION_BRANCH;
	version = import.meta.env.VITE_APP_VERSION;

	private socket: WebSocket | null = null;
	private eventSource: EventSource | null = null;
	private shouldResume = false;
	private shouldReconnect = true;
	private disconnectTimer: number | null = null;
	private disconnectReason = "";

	get platform(): Platform {
		return "TWITCH";
	}

	constructor(private driver: WorkerDriver) {}

	private getContext(): EventContext {
		return {
			db: this.driver.db,
			driver: this.driver,
			eventAPI: this,
		};
	}

	connect(transport: EventAPITransport): void {
		if (this.eventSource || this.socket || !this.url) return;

		const url = new URL(this.url);

		url.searchParams.append("app", `7tv-extension${this.branch ? `-${this.branch}` : ""}`);
		url.searchParams.append("version", this.version);

		this.transport = transport;

		if (this.transport === "WebSocket") {
			this.socket = new WebSocket(url);
			this.socket.onopen = () => this.onOpen();
			this.socket.onclose = () => this.onClose();
			this.socket.onmessage = (ev) => {
				const { op, d } = JSON.parse(ev.data);

				this.onMessage({
					op: EventAPIOpCode[op].toString() as keyof typeof EventAPIOpCode,
					data: d,
				});
			};
			this.shouldReconnect = true;
			this.disconnectTimer = null;
			this.disconnectReason = "";
		}

		log.debug("<EventAPI>", "Connecting...", `url=${this.url}`);
	}

	getSocket(): WebSocket | null {
		return this.socket;
	}

	private onMessage<T extends keyof typeof EventAPIOpCode>(msg: EventAPIMessage<T>): void {
		switch (msg.op) {
			case "HELLO":
				this.onHello(msg as EventAPIMessage<"HELLO">);
				break;
			case "DISPATCH":
				this.onDispatch(msg as EventAPIMessage<"DISPATCH">);
				break;
			case "ERROR":
				this.onError(msg as EventAPIMessage<"ERROR">);
				break;
			case "ACK":
				this.onAck(msg as EventAPIMessage<"ACK">);
				break;
			case "ENDOFSTREAM": {
				const eos = msg as EventAPIMessage<"ENDOFSTREAM">;

				log.warn("<EventAPI>", "End of stream", `| ${eos.data.code} ${eos.data.message}`);
				break;
			}

			default:
				break;
		}
	}

	private onOpen(): void {
		log.info("<EventAPI>", "Connected", `url=${this.url}`);
	}

	private onHello(msg: EventAPIMessage<"HELLO">): void {
		if (this.shouldResume) {
			this.resume(this.sessionID);
		} else if (this.sessionID) {
			this.syncSubscriptions();
		}

		this.sessionID = msg.data.session_id;
		this.heartbeatInterval = msg.data.heartbeat_interval;
		this.backoff = 100;

		this.shouldResume = false;

		log.info(
			"<EventAPI>",
			"Server says hello,",
			`sessionID=${this.sessionID} heartbeatInterval=${this.heartbeatInterval}`,
		);
	}

	onDispatch(msg: EventAPIMessage<"DISPATCH">): void {
		handleDispatchedEvent(this.getContext(), msg.data.type, msg.data.body);

		log.debugWithObjects(["<EventAPI>", "Dispatch received"], [msg.data]);
	}

	private onAck(msg: EventAPIMessage<"ACK">): void {
		switch (msg.data.command) {
			case "SUBSCRIBE": {
				const { id, type, condition } = msg.data.data as SubscriptionData;

				const sub = this.findSubscription(type, condition);
				if (sub) {
					sub.confirmed = true;
					sub.id = id;
					break;
				}
				break;
			}
			case "RESUME": {
				const { success, dispatches_replayed, subscriptions_restored } = msg.data.data as {
					success: boolean;
					dispatches_replayed: number;
					subscriptions_restored: number;
				};

				if (success) {
					log.info(
						"<EventAPI>",
						"Successfully resumed",
						`dispatchesReplayed=${dispatches_replayed} subscriptionsRestored=${subscriptions_restored}`,
					);
				} else {
					log.debug("<EventAPI>", "Resume failed, manually reconfiguring...");

					this.shouldResume = false;
					this.syncSubscriptions();
				}
			}
		}

		log.debugWithObjects(["<EventAPI>", "Ack received"], [msg.data]);
	}

	private onError(msg: EventAPIMessage<"ERROR">): void {
		log.error("<EventAPI>", "Error received", msg.data.message);
	}

	resume(sessionID: string): void {
		this.sendMessage({
			op: "RESUME",
			data: {
				session_id: sessionID,
			},
		});

		log.debug("<EventAPI>", "Attempting to resume...", `sessionID=${sessionID}`);
	}

	subscribe(type: string, condition: Record<string, string>, port: WorkerPort, channelID: string) {
		const sub = this.findSubscription(type, condition);
		if (sub) {
			sub.ports.set(port.id, port);
			sub.channels.add(channelID);
			return;
		}

		if (!Array.isArray(this.subscriptions[type])) {
			this.subscriptions[type] = [];
		}

		this.subscriptions[type].push({
			condition,
			ports: new Map([[port.id, port]]),
			channels: new Set([channelID]),
		});

		if (this.socket === null) {
			this.connect(this.transport);
		}

		if (typeof this.disconnectTimer === "number" && this.disconnectReason === "inactive") {
			clearTimeout(this.disconnectTimer);
			this.disconnectTimer = null;
		}

		this.sendMessage({
			op: "SUBSCRIBE",
			data: {
				type,
				condition,
			},
		});
	}

	unsubscribe(type: string, condition: Record<string, string>, port: WorkerPort) {
		const sub = this.findSubscription(type, condition);
		if (!sub) return;

		sub.ports.delete(port.id);
		if (sub.ports.size <= 0) {
			this.subscriptions[type] = this.subscriptions[type].filter((c) => c !== sub);
			if (!this.subscriptions[type].length) {
				delete this.subscriptions[type];
			}

			this.sendMessage({
				op: "UNSUBSCRIBE",
				data: {
					type,
					condition,
				},
			});
		}

		if (!Object.keys(this.subscriptions).length) {
			this.disconnect(false, 5e3, "inactive");
		}
	}

	unsubscribeChannel(id: string, port: WorkerPort): void {
		for (const [type, records] of Object.entries(this.subscriptions)) {
			for (const rec of records.filter((rec) => rec.channels.has(id))) {
				rec.channels.delete(id);
				if (rec.channels.size) continue;

				this.unsubscribe(type, rec.condition, port);
			}
		}
	}

	findSubscription(type: string, condition: Record<string, string>): SubscriptionRecord | null {
		const sub = this.subscriptions[type];
		if (!sub) return null;

		return sub.find((c) => Object.entries(condition).every(([key, value]) => c.condition[key] === value)) ?? null;
	}

	findSubscriptionByID(id: number[]): SubscriptionRecord[] {
		const result = [] as SubscriptionRecord[];

		for (const type in this.subscriptions) {
			const sub = this.subscriptions[type];
			if (!sub) continue;

			const found = sub.find((c) => typeof c.id === "number" && id.includes(c.id));
			if (!found) continue;

			result.push(found);
		}

		return result;
	}

	syncSubscriptions(): void {
		for (const [t, rec] of Object.entries(this.subscriptions)) {
			delete this.subscriptions[t];

			for (const sub of rec) {
				for (const port of sub.ports.values()) {
					for (const channelID of sub.channels) this.subscribe(t, sub.condition, port, channelID);
				}
			}
		}
	}

	sendMessage<O extends keyof typeof EventAPIOpCode>(msg: EventAPIMessage<O>): void {
		// retry if we're no primary has been selected or the socket isn't ready
		if (!(this.socket && this.socket.readyState === WebSocket.OPEN)) {
			setTimeout(() => this.sendMessage(msg), 100);
			return;
		}

		log.debug("<EventAPI>", "Sending message with op:", msg.op.toString());

		if (!this.socket) return;

		this.socket.send(
			JSON.stringify({
				op: EventAPIOpCode[msg.op],
				d: msg.data,
			}),
		);
	}

	private onClose(): void {
		this.socket = null;

		let n = 0;
		if (this.shouldReconnect) {
			n = this.reconnect();
			this.shouldResume = true;
		}

		log.debug(
			"<EventAPI>",
			"Disconnected",
			`url=${this.url}, reconnect=${n || "no"}, ${this.disconnectReason && `reason=${this.disconnectReason}`}`,
		);
	}

	reconnect(): number {
		const jitter = Math.min((this.backoff += getRandomInt(1000, 5000)), 120000);

		setTimeout(() => {
			if (this.socket || !this.transport) return;

			this.connect(this.transport);
		}, jitter);
		return jitter;
	}

	disconnect(shouldReconnect = true, timer = 0, reason = ""): void {
		this.disconnectReason = reason;

		const f = () => {
			if (!this.socket) return;

			this.socket.close(1000);
			this.socket = null;
			this.shouldReconnect = shouldReconnect;
			this.disconnectTimer = null;
		};

		if (timer) {
			this.disconnectTimer = setTimeout(f, timer);
		} else {
			f();
		}
	}
}

export interface SubscriptionRecord {
	id?: number;
	condition: Record<string, string>;
	ports: Map<symbol, WorkerPort>;
	channels: Set<string>;
	confirmed?: boolean;
}

type EventAPITransport = "WebSocket" | "EventStream";
