import { DataStructure } from '@typings/typings/DataStructure';
import { Subject } from 'rxjs';
import { Config } from 'src/Config';
import { broadcastExtensionMessage, ExtensionRuntimeMessage, getRunningContext } from 'src/Global/Util';
import { Logger } from 'src/Logger';
import { version } from 'public/manifest.v3.json';


export class EventAPI {
	ctx = getRunningContext();
	private channels = new Set<string>();
	private connection: EventSource | null = null;

	emoteEvent = new Subject<EventAPI.EmoteEventUpdate>();

	constructor() {
		if (this.ctx === 'content') {
			chrome.runtime.onMessage.addListener((msg: ExtensionRuntimeMessage) => {
				if (msg.tag === 'EventAPI:Message/ChannelEmotes') {
					this.emoteEvent.next(msg.data);
				}
			});
		}
	}

	/**
	 * Create a connection to the Event API
	 */
	private connect(): void {
		if (this.ctx !== 'background') {
			throw new Error('connect() can only be executed in the background');
		}

		// Format query with channel list
		const query = new URLSearchParams();
		query.set('channel', this.getChannelList());
		query.set('agent', `webext:${version}`);
		// Create connect URL
		const url = `${Config.secure ? 'https' : 'http'}:${Config.eventsUrl}/channel-emotes?${query.toString()}`;
		if (!!this.connection) {
			this.connection.close();
		}
		// Make the connection
		const src = this.connection = new EventSource(url);

		// message is received
		src.addEventListener('update', ev => this.onMessage(ev as MessageEvent));
		// connection is ready to receive messages
		src.addEventListener('ready', ev => {
			if (!(ev instanceof MessageEvent)) {
				return undefined;
			}

			Logger.Get().info(`<EVENTS> Listening ${url} (${ev.data})`);
		});
		// an error occured
		src.addEventListener('error', err => console.error(err));

	}

	/**
	 * Get a list of channels the user is currently observing
	 */
	private getChannelList(): string {
		const result = [] as string[];

		for (const c of this.channels) {
			result.push(c);
		}

		return result.join(',');
	}

	private onMessage(ev: MessageEvent): void {
		let data: EventAPI.EmoteEventUpdate | null = null;
		try {
			data = JSON.parse(ev.data);
		} catch (err) {
			Logger.Get().error('<EVENTS> Parse on message failed', (err as any).message);
		}
		if (!data) {
			return undefined;
		}

		broadcastExtensionMessage('EventAPI:Message/ChannelEmotes', data, undefined);
	}

	/**
	 * Add a channel to be observed for eventss
	 *
	 * @param channelName the channel to add to the observed list
	 */
	addChannel(channelName: string): void {
		if (this.ctx === 'background') {
			// User exceeds 100 channels: we will unsubscribe from the oldest one
			if (this.channels.size >= 100) {
				for (const ch of this.channels) {
					this.channels.delete(ch);
					Logger.Get().info(`<EVENTS> Exceeded 100 channel subscriptions, unsubscribing from ${ch}`);
					break;
				}
				return undefined;
			}

			// Add to list & connect
			this.channels.add(channelName);
			this.connect();
		}
	}

	/**
	 * Remove a channel from the observed list.
	 *
	 * If there are no more observed channels after this call,
	 * the connection will be closed.
	 *
	 * @param channelName the channel to remove from the observed list
	 */
	removeChannel(channelName: string): void {
		if (this.ctx === 'background') {
			this.channels.delete(channelName);

			// User must have at least one channel left to reconnect
			if (this.channels.size > 0) {
				this.connect();
			} else if (!!this.connection) { // No channels but connection is open: close it.
				this.connection.close();
				Logger.Get().info('<EVENTS> User no longer on any channel, closing connection');
			}
		}
	}
}

export namespace EventAPI {
	export interface EmoteEventUpdate {
		channel: string;
		emote_id: string;
		emote: DataStructure.Emote;
		name: string;
		action: 'ADD' | 'REMOVE' | 'UPDATE';
		actor: string;
	}
}
