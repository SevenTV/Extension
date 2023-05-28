import { InjectionKey } from "vue";

export interface ChatRoom {
	chatroom: ChatRoomData | null;
	currentChannelSlug: string;
	currentMessage: string;
}

export interface ChatRoomData {
	id: number;
}

export interface KickChannelInfo {
	active: boolean;
	slug: string;
	currentMessage: string;
}

export const KICK_CHANNEL_KEY = Symbol() as InjectionKey<KickChannelInfo>;
