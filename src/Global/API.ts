import { DataStructure } from '@typings/typings/DataStructure';
import { from, Observable } from 'rxjs';
import { map, mergeAll, switchMap, toArray } from 'rxjs/operators';
import { Config } from 'src/Config';
import { getRunningContext, sendExtensionMessage } from 'src/Global/Util';
import request, { post } from 'superagent';
import { version } from 'public/manifest.json';
import { Badge } from 'src/Global/Badge';
import { EventAPI } from 'src/Global/Events/EventAPI';

export class API {
	private BASE_URL = `${Config.secure ? 'https' : 'http'}:${Config.apiUrl}/v2`;
	private BASE_URL_FFZ = 'https://api.frankerfacez.com/v1';
	private BASE_URL_BTTV = 'https://api.betterttv.net/3';

	events = new EventAPI();

	constructor() {}

	/**
	 * Get the channel emotes of a channel
	 *
	 * @param channelID the channel's name
	 * @param providers a list of providers from which to get emotes
	 * @returns an array of emotes
	 */
	GetChannelEmotes(channelID: string): Observable<DataStructure.Emote[]> {
		return this.createRequest<DataStructure.Emote[]>(`/users/${channelID}/emotes`, { method: 'GET' }).pipe(
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

	GetFrankerFaceZChannelEmotes(channelID: string): Observable<DataStructure.Emote[]> {
		return this.createRequest<API.FFZ.RoomResponse>(`/room/id/${channelID}`, { method: 'GET', baseUrl: this.BASE_URL_FFZ }).pipe(
			map(res => Object.keys(res.body.sets).map(k => res.body.sets[k].emoticons).reduce((a, b) => [...a, ...b])),
			mergeAll(),
			map(emote => this.transformFFZ(emote)),
			toArray()
		);
	}

	GetFrankerFaceZGlobalEmotes(): Observable<DataStructure.Emote[]> {
		return this.createRequest<API.FFZ.RoomResponse>(`/set/global`, { method: 'GET', baseUrl: this.BASE_URL_FFZ }).pipe(
			map(res => Object.keys(res.body.sets).map(k => res.body.sets[k].emoticons).reduce((a, b) => [...a, ...b])),
			mergeAll(),
			map(emote => this.transformFFZ(emote, true)),
			toArray()
		);
	}

	GetBTTVChannelEmotes(channelID: string): Observable<DataStructure.Emote[]> {
		return this.createRequest<API.BTTV.UserResponse>(`/cached/users/twitch/${channelID}`, { method: 'GET', baseUrl: this.BASE_URL_BTTV }).pipe(
			map(res => [...res.body?.channelEmotes ?? [], ...res.body?.sharedEmotes ?? []]),
			mergeAll(),
			map(emote => this.transformBTTV(emote)),
			toArray()
		);
	}

	GetBTTVGlobalEmotes(): Observable<DataStructure.Emote[]> {
		return this.createRequest<API.BTTV.Emote[]>('/cached/emotes/global', { method: 'GET', baseUrl: this.BASE_URL_BTTV }).pipe(
			map(res => res.body),
			mergeAll(),
			map(emote => this.transformBTTV(emote, true)),
			toArray()
		);
	}

	private transformFFZ(emote: API.FFZ.Emote, global = false): DataStructure.Emote {
		return {
			id: String(emote.id),
			name: emote.name,
			status: 3,
			tags: [],
			provider: 'FFZ',
			visibility: global ? DataStructure.Emote.Visibility.GLOBAL : 0,
			urls: [
				['1', emote.urls['1']],
				['2', emote.urls['2']],
				['3', emote.urls['4']],
				['4', emote.urls['4']],
			],
			owner: emote.owner ? {
				id: emote.id,
				login: emote.owner?.name,
				display_name: emote.owner?.display_name
			} as unknown as DataStructure.TwitchUser : null
		} as DataStructure.Emote;
	}

	private transformBTTV(emote: API.BTTV.Emote, global = false): DataStructure.Emote {
		return {
			id: emote.id,
			name: emote.code,
			status: 3,
			tags: [],
			provider: 'BTTV',
			visibility: (global ? DataStructure.Emote.Visibility.GLOBAL : 0) | (API.BTTV.ZeroWidth.includes(emote.code) ? DataStructure.Emote.Visibility.ZERO_WIDTH : 0),
			urls: [
				['1', `https://cdn.betterttv.net/emote/${emote.id}/1x`],
				['2', `https://cdn.betterttv.net/emote/${emote.id}/2x`],
				['3', `https://cdn.betterttv.net/emote/${emote.id}/3x`],
				['4', `https://cdn.betterttv.net/emote/${emote.id}/3x`],
			],
			owner: emote.user ? {
				id: emote.user.id,
				login: emote.user.name,
				display_name: emote.user.displayName
			} as unknown as DataStructure.TwitchUser : null
		} as DataStructure.Emote;
	}

	createRequest<T>(route: string, options: Partial<API.CreateRequestOptions>): Observable<API.Response<T>> {
		return new Observable<API.Response<T>>(observer => {
			const ctx = getRunningContext();

			if (ctx === 'background') {
				const uri = (options.baseUrl ? options.baseUrl : this.BASE_URL) + route;

				from(request(options.method || 'POST', uri).set(
					'X-SevenTV-Platform', 'WebExtension',
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
		baseUrl?: string;
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
	export namespace FFZ {
		export interface RoomResponse {
			sets: { [key: string]: {
				emoticons: FFZ.Emote[];
			}};
		}

		export interface Emote {
			id: number;
			name: string;
			height: number;
			width: number;
			public: boolean;
			hidden: boolean;
			owner: {
				_id: number;
				name: string;
				display_name: string;
			} | null;
			urls: {
				'1': string;
				'2': string;
				'4': string;
			};
		}
	}

	export namespace BTTV {
		export interface UserResponse {
			channelEmotes: BTTV.Emote[];
			sharedEmotes: BTTV.Emote[];
		}

		export interface Emote {
			id: string;
			code: string;
			imageType: string;
			user: {
				id: string;
				name: string;
				displayName: string;
				providerId: string;
			} | null;
			userId: string;
		}

		export const ZeroWidth = [
			'SoSnowy', 'IceCold', 'SantaHat', 'TopHat',
			'ReinDeer', 'CandyCane', 'cvMask', 'cvHazmat',
		];
	}
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
