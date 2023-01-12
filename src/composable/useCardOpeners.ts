import { reactive } from "vue";

export const tools = reactive({
	onShowEmoteCard: (() => null) as Twitch.ViewerCardComponent["onShowEmoteCard"],
	onShowViewerCard: (() => null) as Twitch.ViewerCardComponent["onShowViewerCard"],
	setViewerCardPage: (() => null) as Twitch.ViewerCardComponent["setViewerCardPage"],
});

export function useCardOpeners(msg: Twitch.ChatMessage) {
	function nameClick(e: MouseEvent) {
		if (!e || !e.currentTarget) return false;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		tools.onShowViewerCard(msg.user.userLogin, 0, msg.id, rect.bottom);
		return true;
	}

	function emoteClick(e: MouseEvent, emote: SevenTV.ActiveEmote) {
		if (emote.provider != "TWITCH") return () => null;
		if (!e || !e.currentTarget) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		tools.onShowEmoteCard({
			emoteID: emote.id,
			emoteCode: emote.name,
			sourceID: "chat",
			initialTopOffset: rect.bottom,
			initialBottomOffset: rect.top,
		});
	}

	function badgeClick(e: MouseEvent, badge: Twitch.ChatBadge) {
		if (!nameClick(e)) return;
		tools.setViewerCardPage({
			type: 2,
			selectedBadgeID: badge.id,
		});
	}

	return {
		nameClick: nameClick,
		badgeClick: badgeClick,
		emoteClick: emoteClick,
	};
}
