import { reactive } from "vue";
import { ChannelContext } from "../channel/useChannelContext";

interface ChatTools {
	TWITCH: {
		onShowViewerCard: Twitch.ViewerCardComponent["onShowViewerCard"];
		onShowViewerWarnPopover: (
			userId: string,
			userLogin: string,
			placement: Twitch.WarnUserPopoverPlacement,
		) => void;
	};
	YOUTUBE: Record<string, never>;
	KICK: Record<string, never>;
	UNKNOWN: Record<string, never>;
}

const m = new WeakMap<ChannelContext, ChatTools>();

export function useChatTools(ctx: ChannelContext) {
	let data = m.get(ctx);
	if (!data) {
		data = reactive<ChatTools>({
			TWITCH: {
				onShowViewerCard: () => void 0,
				onShowViewerWarnPopover: () => void 0,
			},
			YOUTUBE: {},
			KICK: {},
			UNKNOWN: {},
		});

		m.set(ctx, data);
	}

	function update<P extends Platform>(platform: P, key: keyof ChatTools[P], value: ChatTools[P][keyof ChatTools[P]]) {
		if (!data) return;

		data[platform][key] = value;
	}

	function openViewerCard(e: MouseEvent, username: string, msgID: string) {
		if (!data || !e || !e.currentTarget || !username) return false;

		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		data[ctx.platform].onShowViewerCard(username, 0, msgID, rect.bottom);
		return true;
	}

	function openViewerWarnPopover(userId: string, userLogin: string, placement: Twitch.WarnUserPopoverPlacement) {
		if (!data || !userId || !userLogin) return false;

		data[ctx.platform].onShowViewerWarnPopover(userId, userLogin, placement);
		return true;
	}

	return {
		update,
		openViewerCard,
		openViewerWarnPopover,
	};
}
