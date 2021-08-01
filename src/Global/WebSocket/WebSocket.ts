import { DataStructure } from '@typings/typings/DataStructure';
import { BehaviorSubject, Subject, timer } from 'rxjs';
import { filter, map, take, takeWhile, tap } from 'rxjs/operators';
import { Config } from 'src/Config';
import { broadcastExtensionMessage, ExtensionRuntimeMessage, getRunningContext, sendExtensionMessage } from 'src/Global/Util';
import { Logger } from 'src/Logger';

const BACKOFF_MULTIPLIER = 1.3;
export class WebSocketAPI {
	ctx = getRunningContext();

	private connectionURL = `${Config.secure ? 'wss' : 'ws'}:${Config.wsUrl}`;
	private socket: WebSocket | null = null;
	private currentBackoff = 1000;

	get open(): boolean {
		return !!this.socket && this.socket.readyState === WebSocket.OPEN;
	}
	opened = new BehaviorSubject<boolean>(false);
	dispatch = new Subject<WebSocketAPI.Message>();
	subscriptions = [] as WebSocketAPI.Subscription[];

	closed = new BehaviorSubject<boolean>(true);

	constructor() { }

	create(): void {
		if (this.ctx === 'background') {
			if (this.open) {
				Logger.Get().debug('Session is already ongoing');
				return undefined;
			}
			const socket = this.socket = new WebSocket(this.connectionURL);

			socket.onmessage = ev => this.onMessage(ev);
			socket.onopen = () => this.onOpen();
			socket.onclose = ev => this.onClose(ev);
		} else if (this.ctx === 'content') {
			sendExtensionMessage('EditWebSocket', {
				do: 'create'
			});

			if (!this.opened.getValue()) {
				chrome.runtime.onMessage.addListener((msg: ExtensionRuntimeMessage) => {
					if (msg.tag === 'WebSocketDispatch') {
						this.dispatch.next(msg.data);
					}
					if (msg.tag === 'WebSocketState') {
						switch (msg.data.state) {
							case 'open':
								this.opened.next(true);
								this.closed.next(false);
								break;
							case 'close':
								this.closed.next(true);
								this.opened.next(false);
						}
					}
				});
			}
		}
	}

	private onOpen(): void {
		Logger.Get().info(`<WS> Connected to ${this.connectionURL}`);
		this.opened.next(true);
		this.closed.next(false);
		broadcastExtensionMessage('WebSocketState', { state: 'open' }, undefined);
	}

	private onClose(ev: CloseEvent): void {
		Logger.Get().info(`<WS> Connection closed (${ev.code}${!!ev.reason ? ` ${ev.reason}` : ''})`);
		this.closed.next(true);
		broadcastExtensionMessage('WebSocketState', { state: 'close' }, undefined);

		if (ev.code !== 1000 && ev.reason !== 'Unknown User') {
			Logger.Get().debug(`<WS> Trying to reconnect in ${(this.currentBackoff / 1000).toFixed(1)}s`);

			setTimeout(() => {
				this.currentBackoff *= Math.random() * 0.2 + BACKOFF_MULTIPLIER;
				this.create();
			}, Math.min(600 * 1000, this.currentBackoff));
		}
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
				broadcastExtensionMessage('WebSocketDispatch', msg, undefined);
				break;
			}
			case WebSocketAPI.Op.HEARTBEAT_ACK:
				this.currentBackoff = 1000;
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
			filter(open => open === true),
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

				Logger.Get().info(`<WS> Send -> op: ${op}`);
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

	close(code = 1000): void {
		if (this.ctx !== 'background') return undefined;

		if (!!this.socket) {
			this.socket.close(code);
		}
		Logger.Get().info(`<WS> Terminated WebSocket.`);
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

	export interface Subscription {
		type: number;
		params: { [key: string]: any; };
	}

	export interface ExtensionMessage extends ExtensionRuntimeMessage {
		do: ExtensionMessage.Type;
		data: any;
	}
	export namespace ExtensionMessage {
		export type Type = 'create' | 'send-message';
	}
}
