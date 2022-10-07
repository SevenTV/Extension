import { defineStore } from "pinia";

export interface State {
	messages: Twitch.ChatMessage[];
	messageIds: Set<string>;
	lineLimit: number;
	emoteMap: Record<string, SevenTV.ActiveEmote>;
}

export const useTwitchStore = defineStore("chat", {
	state: () =>
		({
			channel: null,
			messages: [],
			messageIds: new Set(),
			lineLimit: 250,
			emoteMap: {},
		} as State),

	getters: {
		currentMessage: (state) => state.messages[state.messages.length - 1],
	},

	actions: {
		pushMessage(message: Twitch.ChatMessage) {
			if (this.messageIds.has(message.id)) return;

			this.messages.push(message);
			this.messageIds.add(message.id);

			if (this.messages.length > this.lineLimit) {
				const msg = this.messages.shift() as Twitch.ChatMessage;
				this.messageIds.delete(msg.id);
			}
		},
	},
});
