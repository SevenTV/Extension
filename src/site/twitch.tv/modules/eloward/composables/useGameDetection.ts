import { computed } from "vue";
import { useChannelContext } from "@/composable/channel/useChannelContext";

// Constants for League of Legends detection (to be used in future implementation)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LEAGUE_OF_LEGENDS_ID = "21779";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LEAGUE_OF_LEGENDS_NAME = "League of Legends";

export function useGameDetection() {
	// For now, return a simple implementation that always returns false
	// This will be enhanced later with proper Twitch API integration
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const ctx = useChannelContext();

	const isLeagueStream = computed(() => {
		// TODO: Implement proper game detection using Twitch API
		// For now, return false to avoid TypeScript errors
		// Will use ctx.id and LEAGUE_OF_LEGENDS_ID/LEAGUE_OF_LEGENDS_NAME in future implementation
		return false;
	});

	const currentGame = computed(() => {
		// TODO: Implement proper game detection using Twitch API
		// For now, return empty string
		return "";
	});

	const currentGameId = computed(() => {
		// TODO: Implement proper game detection using Twitch API
		// For now, return empty string
		return "";
	});

	return {
		currentGame,
		currentGameId,
		isLeagueStream,
	};
}
