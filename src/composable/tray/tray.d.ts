import type { ChatMessage } from "@/common/chat/ChatMessage";

export type TrayProps<T extends keyof Twitch.ChatTray.Type> = {
	Reply: {
		msg: ChatMessage;
	};
}[T] & {
	close?: () => void;
};
