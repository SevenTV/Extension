import { reactive } from "vue";
import { ChatMessage } from "@/common/chat/ChatMessage";
import { ChannelContext } from "../channel/useChannelContext";

interface ChatTools {
	TWITCH: {
		onShowViewerCard: Twitch.ViewerCardComponent["onShowViewerCard"];
	};
	YOUTUBE: Record<string, never>;
	UNKNOWN: Record<string, never>;
}

const m = new WeakMap<ChannelContext, ChatTools>();

export function useChatTools(ctx: ChannelContext) {
	let data = m.get(ctx);
	if (!data) {
		data = reactive<ChatTools>({
			TWITCH: {
				onShowViewerCard: () => void 0,
			},
			YOUTUBE: {},
			UNKNOWN: {},
		});

		m.set(ctx, data);
	}

	function update<P extends Platform>(platorm: P, key: keyof ChatTools[P], value: ChatTools[P][keyof ChatTools[P]]) {
		if (!data) return;

		data[platorm][key] = value;
	}

	function openViewerCard(e: MouseEvent, msg: ChatMessage) {
		if (!data || !e || !e.currentTarget || !msg.author) return false;

		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		data[ctx.platform].onShowViewerCard(msg.author.username, 0, msg.id, rect.bottom);
		return true;
	}

	return {
		update,
		openViewerCard,
	};
}
