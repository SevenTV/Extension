export type TrayProps<T extends keyof Twitch.ChatTray.Type> = {
	Reply: {
		id: string;
		authorID?: string;
		body: string;
		deleted: boolean;
		username?: string;
		displayName?: string;
		thread?: {
			deleted: boolean;
			id: string;
			login: string;
		};
	};
}[T] & {
	close?: () => void;
};
