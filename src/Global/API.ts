import { DataStructure } from '@typings/typings/DataStructure';
import { from, Observable, of } from 'rxjs';
import { filter, map, mergeAll, toArray } from 'rxjs/operators';
import { Config } from 'src/Config';
import { version } from 'public/manifest.v3.json';
import { Badge } from 'src/Global/Badge';
import request from 'superagent';

export class API {
	private BASE_URL = `${Config.secure ? 'https' : 'http'}:${Config.apiUrl}/v2`;
	private BASE_URL_FFZ = 'https://api.frankerfacez.com/v1';
	private BASE_URL_BTTV = 'https://api.betterttv.net/3';

	constructor() { }

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

	GetCosmetics(): Observable<{ badges: Badge[]; paints: API.Paint[]; }> {
		return this.createRequest<{ badges: Badge.Data[]; paints: API.Paint[]; }>('/cosmetics?user_identifier=twitch_id', { method: 'GET' }).pipe(
			map(res => ({
				badges: res.body.badges.map(b => new Badge(b)),
				paints: res.body.paints
			}))
		);
	}

	GetEmote(emoteID: string): Observable<DataStructure.Emote> {
		return this.createRequest<DataStructure.Emote>(`/emotes/${emoteID}`, {}).pipe(
			map(res => res.body)
		);
	}

	GetFrankerFaceZChannelEmotes(channelID: string, platform: API.Platform = 'twitch'): Observable<DataStructure.Emote[]> {
		if (platform === 'twitch') {
			return this.createRequest<API.FFZ.RoomResponse>(`/room/id/${channelID}`, { method: 'GET', baseUrl: this.BASE_URL_FFZ }).pipe(
				map(res => res?.body?.sets ? Object.keys(res?.body.sets).map(k => res?.body.sets[k].emoticons).reduce((a, b) => [...a, ...b]) : []),
				mergeAll(),
				filter(emote => !!emote),
				map(emote => this.transformFFZ(emote)),
				toArray()
			);
		} else if (platform === 'youtube') {
			return this.createRequest<API.BTTV.Emote[]>(`/cached/frankerfacez/users/${platform}/${channelID}`, { method: 'GET', baseUrl: this.BASE_URL_BTTV }).pipe(
				map(res => res.body),
				mergeAll(),
				filter(emote => !!emote),
				map(emote => this.transformBTTV(emote, false, true)),
				toArray()
			);
		}
		return of([]);
	}

	GetFrankerFaceZGlobalEmotes(): Observable<DataStructure.Emote[]> {
		return this.createRequest<API.FFZ.RoomResponse>(`/set/global`, { method: 'GET', baseUrl: this.BASE_URL_FFZ }).pipe(
			map(res => Object.keys(res?.body.sets).map(k => res?.body.sets[k].emoticons).reduce((a, b) => [...a, ...b])),
			mergeAll(),
			map(emote => this.transformFFZ(emote, true)),
			toArray()
		);
	}

	GetBTTVChannelEmotes(channelID: string, platform: API.Platform = 'twitch'): Observable<DataStructure.Emote[]> {
		return this.createRequest<API.BTTV.UserResponse>(`/cached/users/${platform}/${channelID}`, { method: 'GET', baseUrl: this.BASE_URL_BTTV }).pipe(
			map(res => [...res?.body?.channelEmotes ?? [], ...res?.body?.sharedEmotes ?? []]),
			mergeAll(),
			map(emote => this.transformBTTV(emote)),
			toArray()
		);
	}

	GetBTTVGlobalEmotes(): Observable<DataStructure.Emote[]> {
		return this.createRequest<API.BTTV.Emote[]>('/cached/emotes/global', { method: 'GET', baseUrl: this.BASE_URL_BTTV }).pipe(
			map(res => res?.body),
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
			width: [emote.width],
			height: [emote.height],
			visibility: global ? DataStructure.Emote.Visibility.GLOBAL : 0,
			urls: [
				['1', emote.urls['1']],
				['2', emote.urls['2']],
				['3', emote.urls['4']],
				['4', emote.urls['4']],
			].filter(([_, url]) => !!url) as [string, string][],
			owner: emote?.owner ? {
				id: emote?.id,
				login: emote.owner?.name,
				display_name: emote.owner?.display_name
			} as unknown as DataStructure.TwitchUser : null
		} as DataStructure.Emote;
	}

	private transformBTTV(emote: API.BTTV.Emote, global = false, isFFZ = false): DataStructure.Emote {
		return {
			id: emote.id,
			name: emote.code,
			status: 3,
			tags: [],
			width: [28],
			height: [28],
			provider: !isFFZ ? 'BTTV' : 'FFZ',
			visibility: (global ? DataStructure.Emote.Visibility.GLOBAL : 0) | (API.BTTV.ZeroWidth.includes(emote.code) ? DataStructure.Emote.Visibility.ZERO_WIDTH : 0),
			urls: [
				['1', emote.images?.['1x'] ?? `https://cdn.betterttv.net/emote/${emote.id}/1x`],
				['2', emote.images?.['2x'] ?? `https://cdn.betterttv.net/emote/${emote.id}/2x`],
				['3', emote.images?.['4x'] ?? `https://cdn.betterttv.net/emote/${emote.id}/3x`],
				['4', emote.images?.['4x'] ?? `https://cdn.betterttv.net/emote/${emote.id}/3x`],
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
			const uri = (options.baseUrl ? options.baseUrl : this.BASE_URL) + route;

			const req = request(options.method || 'POST', uri);
			if (!options.baseUrl) {
				req.set(
					'X-SevenTV-Platform', 'WebExtension',
				).set(
					'X-SevenTV-Version', version
				).send(options.body ?? {});
			}

			from(req).subscribe({
				error(err) { observer.error(new API.ErrorResponse(err.status, err)); },
				next(res) { observer.next({ status: res.status, body: res.body, headers: res.headers }); },
				complete() { observer.complete(); }
			});
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
			sets: {
				[key: string]: {
					emoticons: FFZ.Emote[];
				}
			};
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
			images?: {
				'1x': string;
				'2x': string;
				'4x': string;
			};
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

	export type Platform = 'twitch' | 'youtube';

	export interface Paint {
		id: string;
		name: string;
		users: string[];
		function: string;
		color: number | null;
		stops: Paint.Step[];
		repeat: boolean;
		angle: number;
		shape?: string;
		image_url?: string;
		drop_shadows: Paint.Shadow[];
		animation: Paint.Animation;
	}
	export namespace Paint {
		export interface Step {
			at: number;
			color: number;
		}

		export interface Shadow {
			x_offset: number;
			y_offset: number;
			radius: number;
			color: number;
		}

		export interface Animation {
			speed: number;
			keyframes: Paint.Animation.Keyframe[];
		}
		export namespace Animation {
			export interface Keyframe {
				at: number;
				x: number;
				y: number;
			}
		}
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
