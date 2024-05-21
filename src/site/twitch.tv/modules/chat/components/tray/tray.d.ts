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

export type CustomTrayOptions = Partial<Omit<Twitch.ChatTray, "type" | "body" | "header">>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentProps<C extends Component> = C extends new (...args: any) => any
	? Omit<InstanceType<C>["$props"], keyof VNodeProps | keyof AllowedComponentProps>
	: never;
