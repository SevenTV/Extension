declare module SevenTV {
	interface Emote {
		id: ObjectID;
		name: string;
		flags: EmoteFlags;
		tags: string[];
		lifecycle: EmoteLifecycle;
		listed: boolean;
		animated?: boolean;
		owner: User | null;
		host: ImageHost;
		versions?: EmoteVersion[];
	}

	interface EmoteVersion {
		id: string;
		name: string;
		description: string;
		lifecycle: EmoteLifecycle;
		listed: boolean;
		animated: boolean;
		host: ImageHost;
	}

	enum EmoteLifecycle {
		FAILED = -2,
		DELETED,
		PENDING,
		PROCESSING,
		DISABLED,
		LIVE,
		FAILED,
	}

	enum EmoteFlags {
		PRIVATE = 1 << 0,
		AUTHENTIC = 1 << 1,
		ZERO_WIDTH = 1 << 8,
	}

	interface EmoteSet {
		id: ObjectID;
		name: string;
		tags: string[];
		immutable: boolean;
		privileged: boolean;
		emotes: ActiveEmote[];

		provider?: Provider;
	}

	interface ActiveEmote {
		id: ObjectID;
		name: string;
		flags: number;
		timestamp?: number;
		actor_id?: ObjectID;
		data?: Emote;

		provider?: Provider;
	}

	interface ImageHost {
		url: string;
		files: ImageFile[];
	}

	interface ImageFile {
		name: string;
		static_name?: string;
		width?: number;
		height?: number;
		frame_count?: number;
		size?: number;
		format: ImageFormat;
	}

	interface User {
		id: ObjectID;
		type: UserType;
		username: string;
		display_name: string;
		profile_picture_url: string;
		biography: string;
		connections: UserConnection[];
	}

	interface UserConnection {
		id: ObjectID;
		platform: Platform;
		username: string;
		display_name: string;
		linked_at: number;
		emote_capacity: number;
		emote_set: EmoteSet;

		user?: User;
	}

	type UserType = "" | "BOT" | "SYSTEM";

	type ImageFormat = "AVIF" | "WEBP" | "PNG" | "GIF";

	type ObjectID = string;

	type Provider = "7TV" | "TWITCH" | "BTTV" | "FFZ";

	namespace EventAPI {
		interface WebSocketPayload<T> {
			op: number;
			t: number;
			d: T;
		}
		namespace WebSocketPayload {
			interface Hello {
				heartbeat_interval: number;
				session_id: string;
			}
		}

		interface ChangeMap<T> {
			id: string;
			kind: number;
			actor: null; //
			added: ChangeField<T>[];
			updated: ChangeField<T>[];
			removed: ChangeField<T>[];
			pushed: ChangeField<T>[];
			pulled: ChangeField<T>[];
			object: T;
		}

		interface ChangeField<T, O, N> {
			key: keyof T;
			index: number | null;
			nested?: boolean;
			type: string;
			old_value?: O;
			value: N;
		}
	}
}

declare interface TwitchIdentity {
	id: string;
	login: string;
	displayName: string;
	color?: string;
}

declare interface YouTubeIdentity {
	id: string;
}

declare type Platform = "TWITCH" | "YOUTUBE" | "UNKNOWN";

declare type PlatformIdentity<T extends Platform> = {
	TWITCH: TwitchIdentity;
	YOUTUBE: YouTubeIdentity;
	UNKNOWN: null;
}[T];

interface CurrentChannel {
	id: string;
	username: string;
	display_name: string;
}
