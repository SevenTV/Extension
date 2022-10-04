// REST Helpers
// Fetches initial data from the API

import { log } from "@/common/Logger";
import { db } from "@/db/IndexedDB";

const API_BASE = import.meta.env.VITE_APP_API_REST;

export const seventv = {
	loadUserConnection(platform: Platform, id: string): Promise<SevenTV.UserConnection> {
		return new Promise<SevenTV.UserConnection>(async (resolve, reject) => {
			const resp = await doRequest(`users/${platform.toLowerCase()}/${id}`).catch(err => reject(err));
			if (!resp || resp.status !== 200) {
				reject(resp);
				return;
			}

			const data = (await resp.json()) as SevenTV.UserConnection;
			const u = data.user;
			data.user = undefined;

			db.userConnections.put(data).catch(err => {
				console.error(err);
				db.userConnections
					.where("id")
					.equals(data.id)
					.modify(data)
					.catch(err => {
						console.log("err", err);
					});
			});

			if (u) {
				db.users
					.where("id")
					.equals(u.id)
					.modify(u)
					.catch(() => {
						db.users
							.add(u)
							.catch(err => log.error("<NetWorker/Http>", "failed to add user to database", err));
					});
			}

			resolve(data);
		});
	},
};

function doRequest(path: string): Promise<Response> {
	return fetch(`${API_BASE}/${path}`, {});
}
