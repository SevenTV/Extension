import { DataStructure } from '@typings/typings/DataStructure';
import { from, Observable } from 'rxjs';
import { map, switchMap, tap, toArray } from 'rxjs/operators';
import { Config } from 'src/Config';
import { getRunningContext, sendExtensionMessage } from 'src/Global/Util';
import request, { post } from 'superagent';
import { version } from 'public/manifest.json';
import { Badge } from 'src/Global/Badge';
import { EventAPI } from 'src/Global/Events/EventAPI';

export class API {
	private BASE_URL = `${Config.secure ? 'https' : 'http'}:${Config.apiUrl}/v2`;

	events = new EventAPI();

	constructor() {}

	/**
	 * Get the channel emotes of a channel
	 *
	 * @param channelName the channel's name
	 * @param providers a list of providers from which to get emotes
	 * @returns an array of emotes
	 */
	GetChannelEmotes(channelName: string): Observable<DataStructure.Emote[]> {
		return this.createRequest<DataStructure.Emote[]>(`/users/${channelName}/emotes`, { method: 'GET' }).pipe(
			map(res => res.body ?? [])
		);
	}

	GetEmotesByIDList(list: string[]): Observable<DataStructure.Emote[]> {
		return this.createRequest<{ data: { emotes: DataStructure.Emote[] } }>('/gql', {
			body: {
				query: `
					{
						emotes(list: [${list.map(s => `"${s}"`)}]) {
							${defaultEmoteQuery}
						}
					}
				`,
				variables: {}
			}
		}).pipe(
			map(res => res.body.data.emotes)
		);
	}

	/**
	 * Get 7TV global emotes
	 *
	 * @param providers a list of providers from which to retrieve global emotes
	 * @returns an array of emotes
	 */
	GetGlobalEmotes(): Observable<DataStructure.Emote[]> {
		return this.createRequest<DataStructure.Emote[]>('/emotes/global', { method: 'GET' }).pipe(
			tap(x => console.log(x.body)),
			map(res => res.body)
		);
	}

	GetBadges(): Observable<Badge[]> {
		return this.createRequest<{ badges: Badge.Data[] }>('/badges?user_identifier=twitch_id', { method: 'GET' }).pipe(
			switchMap(res => from(res.body.badges)),
			map(b => new Badge(b)),
			toArray()
		);
	}

	GetEmote(emoteID: string): Observable<DataStructure.Emote> {
		return this.createRequest<DataStructure.Emote>(`/emotes/${emoteID}`, {}).pipe(
			map(res => res.body)
		);
	}

	createRequest<T>(route: string, options: Partial<API.CreateRequestOptions>): Observable<API.Response<T>> {
		return new Observable<API.Response<T>>(observer => {
			const ctx = getRunningContext();

			if (ctx === 'background') {
				const uri = this.BASE_URL + route;

				from(request(options.method || 'POST', uri).set(
					'X-SevenTV-Platform', 'Web',
				).set(
					'X-SevenTV-Version', version
				).send(options.body ?? {})).subscribe({
					error(err) { observer.error(new API.ErrorResponse(err.status, err)); },
					next(res) { observer.next({ status: res.status, body: res.body, headers: res.headers }); },
					complete() { observer.complete(); }
				});
			} else if (ctx === 'content') {
				sendExtensionMessage('APIRequest', {
					route,
					options
				}, (res: API.Response<T>) => {
					observer.next(res);
					observer.complete();
				});
			}
			from(post(''));
		});
	}
}

export namespace API {
	export interface CreateRequestOptions {
		headers: { [key: string]: string };
		auth: boolean;
		body?: any;
		tabId: string;
		method?: string;
	}

	export interface Response<T> {
		status: number;
		body: T;
		headers: { [key: string]: string; };
	}

	export class ErrorResponse extends Error {
		constructor(public status: number, public data: any) {
			super(JSON.stringify(data));
		}
	}

	/** List of foreign emote providers  */
	export type EmoteProvider = 'BTTV' | 'FFZ';
	export type EmoteProviderList = [EmoteProvider?, EmoteProvider?];
}

const defaultEmoteQuery = `
	id
	name
	provider
	provider_id
	visibility
	mime
	width
	height
	owner {
		id, display_name, login, twitch_id
		role {
			id, name, color
		}
	},
	urls
`;
