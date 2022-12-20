// EventAPI - WebSocket
// Keeps our data state up to date

import { log } from "@/common/Logger";
import { getRandomInt } from "@/common/Rand";

export class EventAPI {
	private socket: WebSocket | null = null;
	private sessionID = "";
	private heartbeatInterval: number | null = null;
	private backoff = 100;

	url = import.meta.env.VITE_APP_API_EVENTS;

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

	pushMessage(msg: SevenTV.EventAPI.WebSocketPayload<unknown>): void {
		this.onMessage(msg);
	}

	private onMessage(msg: SevenTV.EventAPI.WebSocketPayload<unknown>): void {
		switch (msg.op) {
			case EventOpCode.HELLO:
				this.onHello(msg as SevenTV.EventAPI.WebSocketPayload<SevenTV.EventAPI.WebSocketPayload.Hello>);
				break;

			default:
				break;
		}
	}

	private onOpen(): void {
		log.info("<Net/EventAPI>", "Connected", `url=${this.url}`);
	}

	private onHello(msg: SevenTV.EventAPI.WebSocketPayload<SevenTV.EventAPI.WebSocketPayload.Hello>): void {
		this.sessionID = msg.d.session_id;
		this.heartbeatInterval = msg.d.heartbeat_interval;
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
