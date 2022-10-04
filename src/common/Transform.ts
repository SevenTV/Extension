export function ConvertTwitchEmoteSet(data: Twitch.TwitchEmoteSet): SevenTV.EmoteSet {
	return {
		id: data.id,
		name: "TwitchSet#" + data.id,
		immutable: true,
		privileged: true,
		tags: [],
		provider: "TWITCH",
		emotes: data.emotes.map(e => ({
			id: e.id,
			name: e.token,
			flags: 0,
			provider: "TWITCH",
			data: ConvertTwitchEmote(e),
		})),
	};
}

export function ConvertTwitchEmote(data: Partial<Twitch.TwitchEmote>): SevenTV.Emote {
	return {
		id: data.id!,
		name: data.token!,
		flags: 0,
		tags: [],
		lifecycle: 3,
		listed: true,
		owner: null,
		host: {
			url: "https://static-cdn.jtvnw.net/emoticons/v2/" + data.id + "/default/dark",
			files: [
				{
					name: "1.0",
					format: "PNG",
				},
				{
					name: "2.0",
					format: "PNG",
				},
				{
					name: "3.0",
					format: "PNG",
				},
				{
					name: "4.0",
					format: "PNG",
				},
			],
		},
	};
}

export function destroyObject(obj: Record<any, any>): void {
	for (const prop in obj) {
		const property = obj[prop];
		if (property === null || typeof property === "undefined") {
			continue;
		}

		if (typeof property === "object") {
			destroyObject(property);
		} else {
			obj[prop] = undefined;
		}
	}
}
