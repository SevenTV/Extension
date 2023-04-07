export type TrayProps<T extends keyof Twitch.ChatTray.Type> = {
	Reply: {
		id: string;
		authorID?: string;
		body: string;
		deleted: boolean;
		username?: string;
		displayName?: string;
	};
}[T] & {
	close?: () => void;
};
