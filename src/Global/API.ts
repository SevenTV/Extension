import { from, Observable } from 'rxjs';
import { Config } from 'src/Config';
import { getRunningContext } from 'src/Global/Util';
import { post, Response } from 'superagent';

export class API {
	private BASE_URL = Config.apiUrl + '/v2';

	constructor() {}

	GetChannelEmotes(channelName: string): Observable<any> {
		return this.createRequest('/gql', {
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
		});
	}

	createRequest(route: string, options: Partial<API.CreateRequestOptions>): Observable<Response> {
		const ctx = getRunningContext();

		if (ctx === 'background') {
			const uri = this.BASE_URL + route;
			return from(post(uri).send(options.body ?? {}));
		} else if (ctx === 'content') {
		}
		return from(post(''));
	}
}

export namespace API {
	export interface CreateRequestOptions {
		headers: { [key: string]: string };
		auth: boolean;
		body?: any;
	}
}
