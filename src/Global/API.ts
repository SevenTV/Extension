import { DataStructure } from '@typings/typings/DataStructure';
import { from, Observable } from 'rxjs';
import { map, switchMap, toArray } from 'rxjs/operators';
import { Config } from 'src/Config';
import { getRunningContext, sendExtensionMessage } from 'src/Global/Util';
import { WebSocketAPI } from 'src/Global/WebSocket/WebSocket';
import request, { post } from 'superagent';
import { version } from 'public/manifest.json';
import { Badge } from 'src/Global/Badge';
import { EventAPI } from 'src/Global/Events/EventAPI';

export class API {
	private BASE_URL = `${Config.secure ? 'https' : 'http'}:${Config.apiUrl}/v2`;

	ws = new WebSocketAPI();
	events = new EventAPI();

	constructor() {}

	/**
	 * Get the channel emotes of a channel
	 *
	 * @param channelName the channel's name
	 * @param providers a list of providers from which to get emotes
	 * @returns an array of emotes
	 */
	GetChannelEmotes(channelName: string, providers: API.EmoteProviderList): Observable<DataStructure.Emote[]> {
		return this.createRequest<{ data: { user: DataStructure.TwitchUser; third_party_emotes: DataStructure.Emote[]; } }>('/gql', {
			body: {
				query: `
					query GetChannelEmotes($channel: String!, $providers: [Provider!]!) {
						user(id: $channel) {
							emotes {
								${defaultEmoteQuery}
							}
						}

						third_party_emotes(providers: $providers, channel: $channel, global: false) {
							${defaultEmoteQuery}
						}
					}
				`,
				variables: {
					providers: providers.map(p => String(p)),
					channel: channelName,
					global: false
				}
			}
		}).pipe(
			map(res => [...res.body.data.user.emotes, ...res.body.data.third_party_emotes])
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
	GetGlobalEmotes(providers: API.EmoteProviderList): Observable<DataStructure.Emote[]> {
		return this.createRequest<{ data: { search_emotes: DataStructure.Emote[]; third_party_emotes: DataStructure.Emote[]; } }>('/gql', {
			body: {
				query: `
					query GetGlobalEmotes($query: String!, $globalState: String!, $limit: Int, $pageSize: Int, $providers: [Provider!]!) {
						search_emotes(query: $query, globalState: $globalState, limit: $limit, pageSize: $pageSize) {
							${defaultEmoteQuery}
						}

						third_party_emotes(providers: $providers, channel: "", global: true) {
							${defaultEmoteQuery}
						}
					}
				`,
				variables: {
					query: '',
					globalState: 'only', global: true,
					limit: 150, pageSize: 150,
					providers
				}
			}
		}).pipe(
			map(res => [...res.body.data.search_emotes, ...res.body.data.third_party_emotes])
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

	newWebSocket(): WebSocketAPI {
		return new WebSocketAPI();
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
