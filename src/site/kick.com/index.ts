import { Ref } from "vue";

export interface ChatRoom {
	chatroom: Ref<ChatRoomData>;
	currentChannelSlug: Ref<string>;
}

export interface ChatRoomData {
	id: number;
}
