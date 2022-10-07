// REST Helpers
// Fetches initial data from the API

import { log } from "@/common/Logger";
import { db } from "@/db/IndexedDB";

const API_BASE = import.meta.env.VITE_APP_API_REST;

export const seventv = {
	async loadUserConnection(platform: Platform, id: string): Promise<SevenTV.UserConnection> {
		const resp = await doRequest(`users/${platform.toLowerCase()}/${id}`).catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const data = (await resp.json()) as SevenTV.UserConnection;
		const u = data.user;
		data.user = undefined;

		db.userConnections.put(data).catch(() => {
			db.userConnections.where("id").equals(data.id).modify(data);
		});

		if (u) {
			db.users
				.where("id")
				.equals(u.id)
				.modify(u)
				.catch(() => {
					db.users
						.add(u)
						.catch((err) => log.error("<NetWorker/Http>", "failed to add user to database", err));
				});
		}

		return Promise.resolve(data);
	},
};

function doRequest(path: string): Promise<Response> {
	return fetch(`${API_BASE}/${path}`, {});
}
