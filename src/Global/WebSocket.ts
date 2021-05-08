import { DataStructure } from '@typings/typings/DataStructure';
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
	dispatch = new Subject<WebSocketAPI.Message>();

	constructor(private tabId?: number) {}

	create(): void{
		if (this.ctx === 'background') {
			if (this.open) {
				this.socket?.close(1000, 'Client is starting a new session');
				this.socket = null;
			}
			const socket = this.socket = new WebSocket(this.connectionURL);

			socket.onmessage = ev => this.onMessage(ev);
			socket.onopen = () => this.onOpen();
			socket.onclose = ev => this.onClose(ev);
		} else if (this.ctx === 'content') {
			sendExtensionMessage('EditWebSocket', {
				do: 'create'
			});

			chrome.runtime.onMessage.addListener((msg: ExtensionRuntimeMessage) => {
				if (msg.tag === 'WebSocketDispatch') {
					this.dispatch.next(msg.data);
				}
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
		let msg: WebSocketAPI.Message | undefined;
		try {
			msg = JSON.parse(ev.data);
		} catch (e) {
			Logger.Get().error(`couldn't parse incoming message, err=${e}`);
		}
		if (!msg) return undefined;

		Logger.Get().info(`<WS> Receive -> op: ${msg.op} | length: ${ev.data.length}`);
		switch (msg.op) {
			case WebSocketAPI.Op.HELLO: {
				const d = msg.d as {
					timestamp: string;
					heartbeat_interval: number;
				};

				timer(500, d.heartbeat_interval).pipe(
					takeWhile(() => this.open),
					map(() => this.send('HEARTBEAT', {}))
				).subscribe();
				break;
			}
			case WebSocketAPI.Op.DISPATCH: {
				sendExtensionMessage('WebSocketDispatch', msg, undefined, this.tabId);
				break;
			}
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

	terminate(code = 1000): void {
		if (this.ctx !== 'background') return undefined;

		this.opened.complete();
		this.dispatch.complete();

		if (!!this.socket) {
			this.socket.close(code);
		}
		Logger.Get().info(`<WS> Terminated (tab ${this.tabId})`);
	}
}

export namespace WebSocketAPI {
	export interface Message<T = any> {
		op: Op;
		d: T;
		seq: number | null;
		t: string | null;
	}
	export namespace MessageData {
		export interface DispatchChannelEmotesUpdate {
			emote: DataStructure.Emote;
			removed: boolean;
			actor: string;
		}
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
