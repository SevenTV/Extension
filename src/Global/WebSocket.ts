import { Subject, timer } from 'rxjs';
import { map, take, takeWhile, tap } from 'rxjs/operators';
import { Config } from 'src/Config';
import { ExtensionRuntimeMessage, getRunningContext, sendExtensionMessage } from 'src/Global/Util';
import { Logger } from 'src/Logger';


export class WebSocketAPI {
	ctx = getRunningContext();

	private connectionURL = `${Config.secure ? 'wss' : 'ws'}:${Config.apiUrl}/v2/ws`;
	private socket: WebSocket | null = null;

	get open(): boolean {
		return !!this.socket && this.socket.readyState === WebSocket.OPEN;
	}
	opened = new Subject<void>();

	constructor() { }

	create(): void{
		if (this.ctx === 'background') {
			const socket = this.socket = new WebSocket(this.connectionURL);

			socket.onmessage = ev => this.onMessage(ev);
			socket.onopen = () => this.onOpen();
			socket.onclose = ev => this.onClose(ev);
		} else if (this.ctx === 'content') {
			sendExtensionMessage('EditWebSocket', {
				do: 'create'
			});
		}
	}

	private onOpen(): void {
		Logger.Get().info(`<WS> Connected to ${this.connectionURL}`);
		this.opened.next(undefined);
	}

	private onClose(ev: CloseEvent): void {
		Logger.Get().info(`<WS> Connection closed (${ev.code}${!!ev.reason ? ` ${ev.reason}` : ''})`);
	}

	private onMessage(ev: MessageEvent<string>): void {
		const msg = JSON.parse(ev.data) as WebSocketAPI.Message;

		Logger.Get().info(`<WS> Receive -> op: ${msg.op} | length: ${ev.data.length}`);
		switch (msg.op) {
			case WebSocketAPI.Op.HELLO:
				const d = msg.d as {
					timestamp: string;
					heartbeat_interval: number;
				};

				timer(500, d.heartbeat_interval).pipe(
					takeWhile(() => this.open),
					map(() => this.send('HEARTBEAT', {}))
				).subscribe();
				break;

			default:
				break;
		}
	}

	waitOpen(cb: () => void): void {
		if (this.open) {
			cb();
			return;
		}

		this.opened.pipe(
			take(1),
			tap(() => cb())
		).subscribe();
	}

	/**
	 * Send a message to the WebSocket Server
	 *
	 * @param op opcode for the message
	 * @param data the data to pass in with the message
	 */
	send<T>(op: keyof typeof WebSocketAPI.Op, data: T): void {
		if (this.ctx === 'background') {
			this.waitOpen(() => {
				if (!this.socket || !this.open) {
					return;
				}

				this.socket.send(JSON.stringify({
					op: WebSocketAPI.Op[op],
					d: data
				}));
			});
		} else if (this.ctx === 'content') {
			sendExtensionMessage('EditWebSocket', {
				do: 'send-message',
				op,
				d: data
			});
		}
	}
}

export namespace WebSocketAPI {
	export interface Message {
		op: Op;
		d: any;
		seq: number | null;
	}

	export enum Op {
		/** @receive */
		DISPATCH,
		/** @receive */
		HELLO,
		/** @send */
		HEARTBEAT,
		/** @receive */
		HEARTBEAT_ACK,
		/** @receive */
		IDENTIFY,
		/** @receive */
		SERVER_CLOSURE,
		/** @send */
		SUBSCRIBE
	}

	export interface ExtensionMessage extends ExtensionRuntimeMessage {
		do: ExtensionMessage.Type;
		data: any;
	}
	export namespace ExtensionMessage {
		export type Type = 'create' | 'send-message';
	}
}
