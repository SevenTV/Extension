import { DataStructure } from '@typings/typings/DataStructure';
import { Subject } from 'rxjs';
import { Config } from 'src/Config';
import { broadcastExtensionMessage, ExtensionRuntimeMessage, getRunningContext, sendExtensionMessage } from 'src/Global/Util';
import { Logger } from 'src/Logger';


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
		// Create connect URL
		const url = `${Config.secure ? 'https' : 'http'}:${Config.eventsUrl}/channel-emotes?${query.toString()}`;
		if (!!this.connection) {
			this.connection.close();
		}
		// Make the connection
		const src = this.connection = new EventSource(url);

		// message is received
		src.addEventListener('message', ev => this.onMessage(ev));
		// connection is ready to receive messages
		src.addEventListener('listening', ev => {
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
			Logger.Get().error('<EVENTS> Parse on message failed', err.message);
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
			this.channels.add(channelName);
			this.connect();
		} else {
			sendExtensionMessage('ConfigureEventAPI', {
				do: 'ADD_CHANNEL',
				channel: channelName
			});
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
