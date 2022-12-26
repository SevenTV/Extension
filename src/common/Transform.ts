const BTTV_ZeroWidth = ["SoSnowy", "IceCold", "SantaHat", "TopHat", "ReinDeer", "CandyCane", "cvMask", "cvHazmat"];

export function convertTwitchEmoteSet(data: Twitch.TwitchEmoteSet): SevenTV.EmoteSet {
	return {
		id: data.id,
		name: "TwitchSet#" + data.id,
		immutable: true,
		privileged: true,
		tags: [],
		provider: "TWITCH",
		emotes: data.emotes.map((e) => ({
			id: e.id,
			name: e.token,
			flags: 0,
			provider: "TWITCH",
			data: convertTwitchEmote(e),
		})),
	};
}

export function convertTwitchEmote(data: Partial<Twitch.TwitchEmote>): SevenTV.Emote {
	return {
		id: data.id ?? "",
		name: data.token ?? "",
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

export function convertBttvEmoteSet(data: BTTV.UserResponse, channelID: string): SevenTV.EmoteSet {
	return {
		id: "BTTV#" + channelID,
		name: "BTTV#" + channelID,
		immutable: true,
		privileged: true,
		tags: [],
		provider: "BTTV",
		emotes: [...data.channelEmotes, ...data.sharedEmotes].map((e) => ({
			id: e.id,
			name: e.code,
			flags: 0,
			provider: "BTTV",
			data: convertBttvEmote(e),
		})),
	};
}

export function convertBttvEmote(data: BTTV.Emote): SevenTV.Emote {
	return {
		id: data.id,
		name: data.code,
		flags: BTTV_ZeroWidth.indexOf(data.code) > -1 ? 256 : 0,
		tags: [],
		lifecycle: 3,
		listed: true,
		owner: null,
		host: {
			url: "https://cdn.betterttv.net/emote/" + data.id,
			files: [
				{
					name: "1x",
					format: data.imageType.toUpperCase() as SevenTV.ImageFormat,
				},
				{
					name: "2x",
					format: data.imageType.toUpperCase() as SevenTV.ImageFormat,
				},
				{
					name: "3x",
					format: data.imageType.toUpperCase() as SevenTV.ImageFormat,
				},
			],
		},
	};
}

export function convertFFZEmoteSet(data: FFZ.RoomResponse, channelID: string): SevenTV.EmoteSet {
	return {
		id: "FFZ#" + channelID,
		name: "FFZ#" + channelID,
		immutable: true,
		privileged: true,
		tags: [],
		provider: "FFZ",
		emotes: Object.values(data.sets).reduce((con, set) => {
			return [
				...con,
				...(set.emoticons.map((e) => {
					return {
						id: e.id.toString(),
						name: e.name,
						flags: 0,
						provider: "FFZ",
						data: convertFFZEmote(e) as SevenTV.Emote,
					};
				}) as SevenTV.ActiveEmote[]),
			];
		}, [] as SevenTV.ActiveEmote[]),
	};
}

export function convertFFZEmote(data: FFZ.Emote): SevenTV.Emote {
	return {
		id: data.id.toString(),
		name: data.name,
		flags: 0,
		tags: [],
		lifecycle: 3,
		listed: true,
		owner: null,
		host: {
			url: "//cdn.frankerfacez.com/emote/" + data.id,
			files: Object.keys(data.urls).map((key) => {
				return {
					name: key,
					format: "PNG",
				};
			}),
		},
	};
}
