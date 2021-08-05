import { Config } from 'src/Config';
import { getRunningContext, sendExtensionMessage } from 'src/Global/Util';
import { Logger } from 'src/Logger';


export class EventAPI {
	ctx = getRunningContext();
	private channels = new Set<string>();
	private connection: EventSource | null = null;

	constructor() {

	}

	private connect(): void {
		if (this.ctx !== 'background') {
			throw new Error('connect() can only be executed in the background');
		}

		const query = new URLSearchParams();
		query.set('channel', this.getChannelList());

		const url = `${Config.secure ? 'https' : 'http'}:${Config.eventsUrl}/channel-emotes?${query.toString()}`;
		if (!!this.connection) {
			this.connection.close();
		}
		const src = this.connection = new EventSource(url);

		src.addEventListener('message', ev => this.onMessage(ev));

		src.addEventListener('listening', ev => {
			if (!(ev instanceof MessageEvent)) {
				return undefined;
			}

			Logger.Get().info(`<EVENTS> Listening ${url} (${ev.data})`);
		});
		src.addEventListener('error', err => console.error(err));

	}

	private getChannelList(): string {
		const result = [] as string[];

		for (const c of this.channels) {
			result.push(c);
		}

		return result.join(',');
	}

	onMessage(ev: MessageEvent): void {
		let data: EventAPI.EmoteEventUpdate | null = null;
		try {
			data = JSON.parse(ev.data);
		} catch (err) {
			Logger.Get().error('<EVENTS> Parse on message failed', err.message);
		}
		if (!data) {
			return undefined;
		}
	}

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
		name: string;
		action: 'removed' | 'added' | 'renamed';
		author: string;
	}
}
