import { ref, computed } from "vue";

const LEAGUE_OF_LEGENDS_ID = "21779";
const LEAGUE_OF_LEGENDS_NAME = "League of Legends";

interface GameInfo {
	displayName?: string;
	name?: string;
	title?: string;
	id?: string;
	gameId?: string;
}

export function useGameDetection() {
	const currentGame = ref<string>("");
	const currentGameId = ref<string>("");
	
	const isLeagueStream = computed(() => {
		return currentGameId.value === LEAGUE_OF_LEGENDS_ID ||
			   currentGame.value === LEAGUE_OF_LEGENDS_NAME ||
			   currentGame.value.toLowerCase().includes("league of legends");
	});

	function updateStreamInfo(streamData: any) {
		if (!streamData) return;

		// Try to get game information from various possible sources
		const gameInfo: GameInfo = streamData.game || streamData.gameInfo || streamData.category;
		
		if (gameInfo) {
			currentGame.value = gameInfo.displayName || gameInfo.name || gameInfo.title || "";
			currentGameId.value = gameInfo.id || gameInfo.gameId || "";
		}
	}

	function setGameInfo(gameName: string, gameId?: string) {
		currentGame.value = gameName;
		if (gameId) {
			currentGameId.value = gameId;
		}
	}

	return {
		currentGame,
		currentGameId,
		isLeagueStream,
		updateStreamInfo,
		setGameInfo
	};
}
