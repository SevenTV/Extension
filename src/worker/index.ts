export interface WorkerMessage<E, T> {
	source: "SEVENTV";
	type: E;
	to?: string;
	seq?: number;
	data: T;
}

// Networking

export type NetWorkerMessage<T extends NetWorkerMessageType> = WorkerMessage<
	NetWorkerMessageType,
	TypedNetWorkerMessage<T>
> & {
	from: NetWorkerInstance;
};

export enum NetWorkerMessageType {
	INIT = 1, // the tab sends this to its dedicated worker to initialize it
	STATE,
	PING,
	PONG,
	MESSAGE,
}

export type TypedNetWorkerMessage<T extends NetWorkerMessageType> = {
	[NetWorkerMessageType.INIT]: {
		id: number;
	};
	[NetWorkerMessageType.PING]: Record<string, never>;
	[NetWorkerMessageType.PONG]: Record<string, never>;
	[NetWorkerMessageType.STATE]: {
		local?: NetWorkerInstance["local"];
	};
	[NetWorkerMessageType.MESSAGE]: SevenTV.EventAPI.WebSocketPayload<unknown>;
}[T];

export interface NetWorkerInstance {
	id: number;
	online: boolean;
	primary: boolean;
	primary_vote?: number;
	local?: {
		platform: Platform;
		identity: TwitchIdentity | YouTubeIdentity | null;
		channel?: CurrentChannel;
	};

	_timeout?: number;
}

// Transform
export type TransformWorkerMessage<T extends TransformWorkerMessageType> = WorkerMessage<
	TransformWorkerMessageType,
	TypedTransformWorkerMessage<T>
>;

export enum TransformWorkerMessageType {
	TWITCH_EMOTES = 1,
	BTTV_EMOTES,
	FFZ_EMOTES,
}

export type TypedTransformWorkerMessage<T extends TransformWorkerMessageType> = {
	[TransformWorkerMessageType.TWITCH_EMOTES]: {
		input?: Twitch.TwitchEmoteSet[];
		output?: SevenTV.Emote[];
	};
	[TransformWorkerMessageType.BTTV_EMOTES]: {
		input?: BTTV.Emote[];
		output?: SevenTV.Emote[];
	};
	[TransformWorkerMessageType.FFZ_EMOTES]: {
		input?: FFZ.Emote[];
		output?: SevenTV.Emote[];
	};
}[T];
