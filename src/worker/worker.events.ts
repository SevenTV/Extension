// EventAPI - WebSocket
// Keeps our data state up to date

import { log } from "@/common/Logger";
import { getRandomInt } from "@/common/Rand";
import { EventAPIMessage, EventAPIOpCode, EventContext, SubscriptionData } from ".";
import { handleDispatchedEvent } from "./event-handlers/handler";
import type { WorkerDriver } from "./worker.driver";

export class EventAPI {
	private transport: EventAPITransport | null = null;
	private sessionID = "";
	private heartbeatInterval: number | null = null;
	private backoff = 100;
	private ctx: EventContext;

	subscriptions: Record<string, SubscriptionRecord[]> = {};

	url = import.meta.env.VITE_APP_API_EVENTS;
	private socket: WebSocket | null = null;
	private eventSource: EventSource | null = null;

	get platform(): Platform {
		return "TWITCH";
	}

	constructor(private driver: WorkerDriver) {
		this.ctx = {
			db: driver.db,
			driver,
			eventAPI: this,
		};
	}

	connect(transport: EventAPITransport): void {
		if (this.eventSource || this.socket || !this.url) return;

		this.transport = transport;

		if (this.transport === "WebSocket") {
			this.socket = new WebSocket(this.url);
			this.socket.onopen = () => this.onOpen();
			this.socket.onclose = () => this.onClose();
			this.socket.onmessage = (ev) => {
				const { op, d } = JSON.parse(ev.data);

				this.onMessage({
					op: EventAPIOpCode[op].toString() as keyof typeof EventAPIOpCode,
					data: d,
				});
			};
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

			default:
				break;
		}
	}

	private onOpen(): void {
		log.info("<EventAPI>", "Connected", `url=${this.url}`);
	}

	private onHello(msg: EventAPIMessage<"HELLO">): void {
		this.sessionID = msg.data.session_id;
		this.heartbeatInterval = msg.data.heartbeat_interval;

		log.info(
			"<EventAPI>",
			"Server says hello,",
			`sessionID=${this.sessionID} heartbeatInterval=${this.heartbeatInterval}`,
		);
	}

	private onDispatch(msg: EventAPIMessage<"DISPATCH">): void {
		handleDispatchedEvent(this.ctx, msg.data.type, msg.data.body);

		log.debugWithObjects(["<EventAPI>", "Dispatch received"], [msg.data]);
	}

	private onAck(msg: EventAPIMessage<"ACK">): void {
		switch (msg.data.command) {
			case "SUBSCRIBE": {
				const { type, condition } = msg.data.data as SubscriptionData;

				const sub = this.getSubscription(type, condition);
				if (sub) {
					sub.confirmed = true;
					break;
				}
				break;
			}
		}

		log.debugWithObjects(["<EventAPI>", "Ack received"], [msg.data]);
	}

	private onError(msg: EventAPIMessage<"ERROR">): void {
		log.error("<EventAPI>", "Error received", msg.data.message);
	}

	subscribe(type: string, condition: Record<string, string>) {
		const sub = this.getSubscription(type, condition);
		if (sub) {
			sub.count++;
			return;
		}

		if (!Array.isArray(this.subscriptions[type])) {
			this.subscriptions[type] = [];
		}

		this.subscriptions[type].push({
			condition,
			count: 1,
		});

		this.sendMessage({
			op: "SUBSCRIBE",
			data: {
				type,
				condition,
			},
		});
	}

	unsubscribe(type: string, condition: Record<string, string>) {
		const sub = this.getSubscription(type, condition);
		if (!sub) return;

		sub.count--;
		if (sub.count <= 0) {
			this.subscriptions[type] = this.subscriptions[type].filter((c) => c !== sub);

			this.sendMessage({
				op: "UNSUBSCRIBE",
				data: {
					type,
					condition,
				},
			});
		}
	}

	getSubscription(type: string, condition: Record<string, string>): SubscriptionRecord | null {
		const sub = this.subscriptions[type];
		if (!sub) return null;

		return sub.find((c) => Object.entries(condition).every(([key, value]) => c.condition[key] === value)) ?? null;
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
		const n = this.reconnect();

		log.debug("<EventAPI>", "Disconnected", `url=${this.url}, reconnect=${n}`);
	}

	reconnect(): number {
		const jitter = Math.min((this.backoff += getRandomInt(1000, 5000)), 120000);

		setTimeout(() => {
			if (this.socket || !this.transport) return;

			this.connect(this.transport);
		}, jitter);
		return jitter;
	}

	disconnect(): void {
		if (!this.socket) return;

		this.socket.close(1000);
		this.socket = null;
	}
}

interface SubscriptionRecord {
	condition: Record<string, string>;
	count: number;
	confirmed?: boolean;
}

type EventAPITransport = "WebSocket" | "EventStream";
