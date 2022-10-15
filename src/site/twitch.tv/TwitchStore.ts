import { defineStore } from "pinia";

export interface State {
	messages: Twitch.ChatMessage[];
	messageIds: Set<string>;
	lineLimit: number;
	emoteMap: Record<string, SevenTV.ActiveEmote>;
	twitchBadgeSets: Twitch.BadgeSets | null;
}

export const useTwitchStore = defineStore("chat", {
	state: () =>
		({
			channel: null,
			messages: [],
			messageIds: new Set(),
			lineLimit: 100,
			emoteMap: {},
			twitchBadgeSets: null,
		} as State),

	getters: {
		currentMessage: (state) => state.messages[state.messages.length - 1],
	},

	actions: {
		pushMessage(message: Twitch.ChatMessage) {
			if (this.messageIds.has(message.id)) return;

			this.messages.push(message);
			this.messageIds.add(message.id);

			// Clear out messages beyond the limit
			const overflowLimit = this.lineLimit * 1.25;
			if (this.messages.length > overflowLimit) {
				const removed = this.messages.splice(0, this.messages.length - this.lineLimit);
				for (const m of removed) {
					this.messageIds.delete(m.id);
				}
			}
		},
	},
});
