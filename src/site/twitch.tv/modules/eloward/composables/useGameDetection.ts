import { ref } from "vue";

const LEAGUE_OF_LEGENDS_SLUG = "league-of-legends";
const CHECK_INTERVAL = 2000;

const isLeagueStream = ref(false);
let checkInterval: number | null = null;

/**
 * Get the category slug of the stream or VOD being watched
 * Uses the link href (/directory/category/league-of-legends) because the link text is localized
 */
function getCategorySlug(): string | null {
	const selector = window.location.pathname.includes("/videos/")
		? "a[data-a-target='video-info-game-boxart-link']"
		: "a[data-a-target='stream-game-link']";

	const href = document.querySelector(selector)?.getAttribute("href");
	const match = href?.match(/\/directory\/category\/([^/?#]+)/i);

	return match ? match[1].toLowerCase() : null;
}

function updateGame() {
	isLeagueStream.value = getCategorySlug() === LEAGUE_OF_LEGENDS_SLUG;
}

export function useGameDetection() {
	// Twitch navigates client-side, renders the header late and streamers can change category mid-stream,
	// so keep re-checking instead of detecting once
	if (checkInterval === null) {
		updateGame();
		checkInterval = window.setInterval(updateGame, CHECK_INTERVAL);
	}

	return {
		isLeagueStream,
	};
}
