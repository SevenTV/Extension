import { DataStructure } from '@typings/typings/DataStructure';
import { from, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Config } from 'src/Config';
import { EmoteStore } from 'src/Global/EmoteStore';
import { getRunningContext, sendExtensionMessage } from 'src/Global/Util';
import { post, Response } from 'superagent';

export class API {
	private BASE_URL = Config.apiUrl + '/v2';

	constructor() {}

	GetChannelEmotes(channelName: string): Observable<DataStructure.Emote[]> {
		return this.createRequest<{ data: { user: DataStructure.TwitchUser; } }>('/gql', {
			body: {
				query: `
					{
						user(id: "${channelName}") {
							id, display_name, login, twitch_id
							emotes {
								id,
								name,
								visibility,
								mime,
								owner {
									id, display_name, login, twitch_id
									role {
										id, name, color
									}
								}
							}
						}
					}
				`,
				variables: {}
			}
		}).pipe(
			map(res => res.body.data.user.emotes)
		);
	}

	createRequest<T>(route: string, options: Partial<API.CreateRequestOptions>): Observable<API.Response<T>> {
		return new Observable<API.Response<T>>(observer => {
			const ctx = getRunningContext();

			if (ctx === 'background') {
				const uri = this.BASE_URL + route;
				from(post(uri).send(options.body ?? {})).subscribe({
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
}
