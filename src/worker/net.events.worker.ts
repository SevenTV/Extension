// EventAPI - WebSocket
// Keeps our data state up to date

import { log } from "@/common/Logger";
import { getRandomInt } from "@/common/Rand";
import { db } from "@/db/IndexedDB";
import { NetWorkerMessageType } from ".";
import { handleDispatchedEvent } from "./event-handlers/handler";
import { EventContext, Payload, WebSocketPayload } from "./events";
import { isPrimary, primaryExists, sendToPrimary } from "./net.worker";

export class EventAPI {
	private socket: WebSocket | null = null;
	private sessionID = "";
	private heartbeatInterval: number | null = null;
	private backoff = 100;
	private ctx: EventContext;

	url = import.meta.env.VITE_APP_API_EVENTS;

	constructor() {
		this.ctx = {
			db: db,
			eventAPI: this,
		};
	}

	connect(): void {
		if (this.socket || !this.url) return;

		this.socket = new WebSocket(this.url);
		this.socket.onopen = () => this.onOpen();
		this.socket.onclose = () => this.onClose();

		log.debug("<Net/EventAPI>", "Connecting to the EventAPI...", `url=${this.url}`);
	}

	getSocket(): WebSocket | null {
		return this.socket;
	}
	private onMessage(msg: WebSocketPayload<unknown>): void {
		switch (msg.op) {
			case EventOpCode.HELLO:
				this.onHello(msg as WebSocketPayload<Payload.Hello>);
				break;
			case EventOpCode.DISPATCH:
				this.onDispatch(msg as WebSocketPayload<Payload.Dispatch>);
				break;

			default:
				break;
		}
	}

	private onOpen(): void {
		log.info("<Net/EventAPI>", "Connected", `url=${this.url}`);
	}

	private onHello(msg: WebSocketPayload<Payload.Hello>): void {
		this.sessionID = msg.d.session_id;
		this.heartbeatInterval = msg.d.heartbeat_interval;
	}

	private onDispatch(msg: WebSocketPayload<Payload.Dispatch>): void {
		handleDispatchedEvent(this.ctx, msg.d.type, msg.d.body);
	}

	subscribe(type: string, condition: Record<string, string>) {
		const msg = {
			op: EventOpCode.SUBSCRIBE,
			d: {
				type,
				condition,
			},
		};

		this.sendMessage(msg);
	}

	sendMessage(msg: WebSocketPayload<unknown>): void {
		// retry if we're no primary has been selected or the socket isn't ready
		if (!primaryExists() || (isPrimary() && !this.socket)) {
			setTimeout(() => this.sendMessage(msg), 100);
			return;
		}

		// if we are not primary, delegate this to the primary
		if (!isPrimary()) {
			sendToPrimary(NetWorkerMessageType.MESSAGE, msg);
		}

		log.debug("<Net/EventAPI>", "Sending message with op:", msg.op.toString());

		if (!this.socket) return;
		this.socket.send(JSON.stringify(msg));
	}

	pushMessage(msg: WebSocketPayload<unknown>): void {
		if (msg.op >= 32) {
			this.sendMessage(msg);

			return;
		}

		this.onMessage(msg);
	}

	private onClose(): void {
		this.socket = null;
		const n = this.reconnect();

		log.debug("<Net/EventAPI>", "Disconnected", `url=${this.url}, reconnect=${n}`);
	}

	reconnect(): number {
		const jitter = Math.min((this.backoff += getRandomInt(1000, 5000)), 120000);

		setTimeout(() => {
			if (this.socket) return;

			this.connect();
		}, jitter);
		return jitter;
	}

	disconnect(): void {
		if (!this.socket) return;

		this.socket.close(1000);
		this.socket = null;
	}
}

export const ws = new EventAPI();

enum EventOpCode {
	DISPATCH = 0,
	HELLO = 1,
	HEARTBEAT = 2,
	RECONNECT = 4,
	ACK = 5,
	ERROR = 6,
	ENDOFSTREAM = 7,
	IDENTIFY = 33,
	RESUME = 34,
	SUBSCRIBE = 35,
	UNSUBSCRIBE = 36,
	SIGNAL = 37,
}
