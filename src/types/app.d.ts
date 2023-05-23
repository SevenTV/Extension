declare interface SeventvGlobalScope {
	host_manifest: null | {
		version: string;
		worker_file: string;
		stylesheet_file: string;
		index_file: string;
	};
	remote?: boolean;
}

declare const seventv: SeventvGlobalScope;

declare namespace SevenTV {
	interface Emote {
		id: ObjectID;
		name: string;
		flags?: EmoteFlags;
		tags?: string[];
		state?: string[];
		lifecycle?: EmoteLifecycle;
		listed?: boolean;
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
		tags?: string[];
		immutable?: boolean;
		privileged?: boolean;
		flags?: number;
		emotes: ActiveEmote[];
		owner?: User;

		// Non-structural
		provider?: Provider;
		priority?: number;
		scope?: SevenTV.ActiveEmoteScope;
	}

	interface Setting<T extends SettingType> {
		key: string;
		type: typeof T;
		value: T;
		timestamp?: number;
	}

	interface SettingNode<T = SettingType, K = SettingNode.ComponentType> {
		type: K;
		key: string;
		label: string;
		hint?: string;
		path?: [string, string];
		timestamp?: number;

		custom?: {
			component: Raw<object>;
			gridMode: "right" | "new-row";
		};

		defaultValue: T;
		value?: T;
		disabledIf?: () => boolean;
		predicate?: (p: T) => boolean;
		effect?: (v: T) => void;

		options?: {
			SELECT: [string, T][];
			DROPDOWN: [string, T][];
			CHECKBOX: never;
			INPUT: string;
			TOGGLE: {
				left: string;
				right: string;
			};
			SLIDER: {
				min: number;
				max: number;
				step: number;
				unit: string;
				named_thresolds?: [number, number, string][];
				named_values?: [number, number, string][];
			};
			CUSTOM: unknown;
			NONE: never;
		}[K];

		// FFZ compatability
		ffz_key?: string;
		ffz_transform?: (v: unknown) => T;
	}

	type SettingType = boolean | number | string | object;

	namespace SettingNode {
		type ComponentType = "SELECT" | "DROPDOWN" | "CHECKBOX" | "INPUT" | "TOGGLE" | "SLIDER" | "CUSTOM" | "NONE";
	}

	interface ActiveEmote {
		id: ObjectID;
		name: string;
		unicode?: string;
		flags?: number;
		timestamp?: number;
		actor_id?: ObjectID;
		data?: Emote;

		provider?: Provider;
		scope?: ActiveEmoteScope;
		overlaid?: Record<string, ActiveEmote>;
		isTwitchCheer?: {
			amount: number;
			color: string;
		};
	}

	type ActiveEmoteScope = "GLOBAL" | "CHANNEL" | "FOLLOWER" | "PERSONAL" | "SUB";

	interface User {
		id: ObjectID;
		type?: UserType;
		username: string;
		display_name: string;
		avatar_url: string;
		biography?: string;
		style?: UserStyle;
		connections?: UserConnection[];
		emote_sets?: EmoteSet[];
	}

	interface UserStyle {
		color: number;
		paint?: CosmeticPaint;
	}

	interface UserConnection {
		id: ObjectID;
		platform: Platform;
		username: string;
		display_name: string;
		linked_at: number;
		emote_capacity: number;
		emote_set: EmoteSet | null;

		provider?: Provider;
		user?: User;
	}

	interface Cosmetic<K extends CosmeticKind = unknown> {
		id: ObjectID;
		kind: K;
		provider: SevenTV.Provider;
		user_ids?: string[];
		data: {
			AVATAR: CosmeticAvatar;
			BADGE: CosmeticBadge;
			PAINT: CosmeticPaint;
			unknown: never;
		}[K];
	}

	interface CosmeticBadge {
		name: string;
		tooltip: string;
		host: ImageHost;

		backgroundColor?: string;
		replace?: string;
	}

	interface CosmeticPaint {
		name: string;
		color: number | null;
		gradients: CosmeticPaintGradient[];
		shadows?: CosmeticPaintShadow[];
		flairs?: CosmeticPaintFlair[];
		text?: CosmeticPaintText;
		/** @deprecated replaced by `gradients` */
		function?: CosmeticPaintGradientFunction;
		/** @deprecated replaced by `gradients` */
		stops?: CosmeticPaintGradientStop[];
		/** @deprecated replaced by `gradients` */
		repeat?: boolean;
		/** @deprecated replaced by `gradients` */
		angle?: number;
		/** @deprecated replaced by `gradients` */
		shape?: string;
		/** @deprecated replaced by `gradients` */
		image_url?: string;
	}
	type AnyCosmetic = CosmeticBadge | CosmeticPaint;

	type CosmeticPaintCanvasRepeat = "" | "no-repeat" | "repeat-x" | "repeat-y" | "revert" | "round" | "space";

	interface CosmeticPaintGradient {
		function: CosmeticPaintGradientFunction;
		canvas_repeat: CosmeticPaintCanvasRepeat;
		size: [number, number] | null;
		at?: [number, number];
		stops: CosmeticPaintGradientStop[];
		image_url?: string;
		shape?: string;
		angle?: number;
		repeat: boolean;
	}

	type CosmeticPaintGradientFunction = "LINEAR_GRADIENT" | "RADIAL_GRADIENT" | "CONIC_GRADIENT" | "URL";

	interface CosmeticPaintGradientStop {
		at: number;
		color: number;
	}

	interface CosmeticPaintShadow {
		x_offset: number;
		y_offset: number;
		radius: number;
		color: number;
	}

	interface CosmeticPaintText {
		weight?: number;
		shadows?: CosmeticPaintShadow[];
		transform?: "uppercase" | "lowercase";
		stroke?: CosmeticPaintStroke;
	}

	interface CosmeticPaintStroke {
		color: number;
		width: number;
	}

	interface CosmeticPaintFlair {
		kind: CosmeticPaintFlairKind;
		x_offset: number;
		y_offset: number;
		width: number;
		height: number;
		data: string;
	}

	type CosmeticPaintFlairKind = "IMAGE" | "VECTOR" | "TEXT";

	interface CosmeticAvatar {
		id: ObjectID;
		user: Pick<User, "id" | "username" | "display_name" | "connections">;
		host: ImageHost;
	}

	interface Entitlement {
		id: ObjectID;
		kind: EntitlementKind;
		user?: User;
		user_id: ObjectID;
		ref_id: ObjectID;
	}

	interface OldCosmeticsResponse {
		t: number;
		badges: OldCosmeticBadge[];
		paints: OldCosmeticPaint[];
	}

	interface OldCosmeticBadge {
		id: ObjectID;
		users: string[];
		name: string;
		tooltip: string;
		urls: string[][];
	}

	interface OldCosmeticPaint {
		id: ObjectID;
		users: string[];
		name: string;
		function: string;
		color: number | null;
		stops: CosmeticPaintGradientStop[];
		repeat: boolean;
		angle: number;
		shape?: string;
		image_url?: string;
		drop_shadows: CosmeticPaintShadow[];
	}

	type UserType = "" | "BOT" | "SYSTEM";

	type ImageFormat = "AVIF" | "WEBP" | "PNG" | "GIF";

	type ObjectID = string;

	type Provider = "7TV" | "TWITCH" | "BTTV" | "FFZ" | "EMOJI";

	enum ObjectKind {
		USER = 1,
		EMOTE = 2,
		EMOTE_SET = 3,
		ROLE = 4,
		ENTITLEMENT = 5,
		BAN = 6,
		MESSAGE = 7,
		REPORT = 8,
		PRESENCE = 9,
		COSMETIC = 10,
	}

	type CosmeticKind = "BADGE" | "PAINT" | "AVATAR";

	type EntitlementKind = "BADGE" | "PAINT" | "EMOTE_SET";

	interface ImageHost {
		url: string;
		files: ImageFile[];
		srcset?: string;
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

	interface Config {
		version: string;
		overrides: unknown[];
		compatibility: ConfigCompat[];
	}

	interface ConfigCompat {
		id: string[];
		issues: ConfigCompatIssue[];
	}

	interface ConfigCompatIssue {
		severity: ConfigCompatIssueSeverity;
		plaforms: Platform[];
		message: string;
	}

	type ConfigCompatIssueSeverity = "NOTE" | "WARNING" | "BAD_PERFORMANCE" | "CLASHING" | "DUPLICATE_FUNCTIONALITY";
}

declare interface TwitchIdentity {
	id: string;
	username: string;
	displayName: string;
	color?: string;
}

declare interface YouTubeIdentity {
	id: string;
	username: string;
}

declare interface KickIdentity {
	id: string;
	username: string;
}

declare type Platform = "TWITCH" | "YOUTUBE" | "KICK" | "UNKNOWN";

declare type PlatformIdentity<T extends Platform> = {
	TWITCH: TwitchIdentity;
	YOUTUBE: YouTubeIdentity;
	KICK: KickIdentity;
	UNKNOWN: null;
}[T];

interface CurrentChannel {
	id: string;
	username: string;
	displayName: string;
	user?: SevenTV.User;
	active: boolean;
}

declare namespace BTTV {
	interface UserResponse {
		id: string;
		avatar?: string;
		channelEmotes: BTTV.Emote[];
		sharedEmotes: BTTV.Emote[];
	}

	interface EmoteSet {
		id: string;
		channel: string;
		type: SetType;
		emotes: Emote[];
	}

	interface Emote {
		id: string;
		code: string;
		imageType: "png" | "gif";
		userId: string;
		user?: {
			displayName: string;
			id: string;
			name: string;
			providerId: string;
		};
	}

	type SetType = "Global" | "Channel" | "Shared";
}

declare namespace FFZ {
	interface RoomResponse {
		sets: {
			[key: string]: {
				emoticons: FFZ.Emote[];
			};
		};
	}

	interface Emote {
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
		urls: LinkMap;
	}

	interface BadgesResponse {
		badges: Badge[];
		users: Record<string, number[]>;
	}

	interface Badge {
		id: number;
		name: string;
		title: string;
		slot: number;
		replaces: null | string;
		color: string;
		image: string;
		urls: LinkMap;
		css: null | unknown;
	}

	type LinkMap = Record<string, string>;
}

type Only<T, U> = {
	[P in keyof T]: T[P];
} & {
	[P in keyof U]?: never;
};

type Either<T, U> = Only<T, U> | Only<U, T>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare type ComponentFactory = abstract new (...args: any) => any;
declare type AnyInstanceType = InstanceType<ComponentFactory>;

type NestedKeyOf<ObjectType extends object> = {
	[Key in keyof ObjectType]: ObjectType[Key] extends object
		? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
		: Key;
}[keyof ObjectType];
